"""RAG core: document ingestion (parse -> chunk -> embed -> store) and
retrieval-augmented question answering, built on LangChain + Chroma.

Also wires in the rest of the proposed architecture around the model call:
RBAC-scoped retrieval, a post-generation Guardrails check, and an Audit Log
of every interaction.
"""

import os

from langchain_chroma import Chroma
from langchain_community.document_loaders import Docx2txtLoader, PyPDFLoader, TextLoader
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

from audit_log import log_interaction
from guardrails import judge_response, redact_pii

CHROMA_HOST = os.getenv("CHROMA_HOST", "localhost")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", "8000"))
COLLECTION_NAME = os.getenv("CHROMA_COLLECTION", "knowledge_base")

OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150
RETRIEVER_K = 4

# Doubles as the set of valid document access levels ("all" = public/visible
# to everyone) and the set of valid employee roles.
VALID_ROLES = {"all", "hr", "finance", "it"}

LOADERS_BY_EXTENSION = {
    ".pdf": PyPDFLoader,
    ".docx": Docx2txtLoader,
    ".txt": TextLoader,
    ".md": TextLoader,
}

SYSTEM_PROMPT = """You are an internal knowledge-base assistant for company employees.
Answer ONLY using the context below. If the answer is not contained in the context,
say plainly that you don't have this information in the knowledge base — never invent
facts or policies. Always reply in the same language the question was asked in.
Be concise and mention which document each fact came from when it's useful.

Context:
{context}
"""


class InvalidRoleError(Exception):
    """Raised when a role/access-level value isn't in the known RBAC scope set."""


def _normalize_role(value: str | None) -> str:
    role = (value or "all").strip().lower()
    if role not in VALID_ROLES:
        raise InvalidRoleError(f"Unknown role/access level '{role}'. Valid values: {sorted(VALID_ROLES)}")
    return role


def _embeddings() -> OpenAIEmbeddings:
    # Embeddings always stay on OpenAI regardless of LLM_PROVIDER below — swap
    # for a local model (e.g. bge-m3 via HuggingFaceEmbeddings) if documents
    # must never leave your infrastructure.
    return OpenAIEmbeddings(model="text-embedding-3-small")


def _chat_llm():
    """Chat/generation model, swappable via LLM_PROVIDER.

    Default is OpenAI (fast, reliable). Setting LLM_PROVIDER=ollama switches
    to a self-hosted model instead — matching the "LLM (Self-hosted)" box in
    the architecture diagram. That requires `docker compose --profile ollama
    up` and pulling a model once (`docker compose exec ollama ollama pull
    mistral`). Note: vLLM specifically needs an NVIDIA/CUDA GPU and won't run
    on this stack's target hardware — Ollama (llama.cpp-based) is the
    practical self-hosted substitute, but expect slow, CPU-only inference
    without a compatible GPU.
    """
    if LLM_PROVIDER == "ollama":
        from langchain_ollama import ChatOllama

        return ChatOllama(model=OLLAMA_MODEL, base_url=OLLAMA_BASE_URL, temperature=0)
    return ChatOpenAI(model=OPENAI_CHAT_MODEL, temperature=0)


def _vector_store() -> Chroma:
    import chromadb

    client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
    return Chroma(
        client=client,
        collection_name=COLLECTION_NAME,
        embedding_function=_embeddings(),
    )


def add_document_to_index(file_path: str, source_name: str, access_level: str = "all") -> int:
    """Parse a document, split it into chunks, embed them, and add to Chroma.

    Every chunk is tagged with `access_level` so RBAC filtering at retrieval
    time can scope which employees are allowed to see it.
    """
    access_level = _normalize_role(access_level)

    ext = os.path.splitext(file_path)[1].lower()
    loader_cls = LOADERS_BY_EXTENSION.get(ext)
    if loader_cls is None:
        raise ValueError(f"No loader registered for extension '{ext}'")

    try:
        raw_docs = loader_cls(file_path).load()
    except Exception as exc:
        raise ValueError(f"Failed to parse '{source_name}': {exc}") from exc

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )
    chunks = splitter.split_documents(raw_docs)

    for chunk in chunks:
        chunk.metadata["source"] = source_name
        chunk.metadata["access_level"] = access_level

    store = _vector_store()
    store.add_documents(chunks)
    return len(chunks)


def _format_context(docs) -> str:
    return "\n\n".join(f"[{d.metadata.get('source', 'unknown')}]\n{d.page_content}" for d in docs)


def _history_to_messages(history: list[dict] | None) -> list:
    role_to_class = {"user": HumanMessage, "assistant": AIMessage}
    messages = []
    for turn in history or []:
        message_cls = role_to_class.get(turn.get("role"))
        if message_cls is not None and turn.get("content"):
            messages.append(message_cls(content=turn["content"]))
    return messages


def ask_question(question: str, history: list[dict] | None = None, role: str = "all") -> tuple[str, list[str]]:
    """Run the RBAC-scoped retrieval-augmented chain, apply Guardrails to the
    result, log the interaction, and return (answer, cited_sources).
    """
    role = _normalize_role(role)

    store = _vector_store()
    retriever = store.as_retriever(
        search_kwargs={
            "k": RETRIEVER_K,
            # "all" (public) is always visible, plus whatever this role grants.
            "filter": {"access_level": {"$in": sorted({"all", role})}},
        }
    )
    retrieved_docs = retriever.invoke(question)

    context = _format_context(retrieved_docs)
    sources = sorted({d.metadata.get("source", "unknown") for d in retrieved_docs})

    # History is passed via MessagesPlaceholder (actual message objects), not
    # string-formatted into the template, so braces/JSON/code pasted by users
    # in earlier turns can't be misparsed as template placeholders.
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder("history"),
            ("human", "{question}"),
        ]
    )
    llm = _chat_llm()

    chain = (
        RunnablePassthrough.assign(context=lambda _: context)
        | prompt
        | llm
        | StrOutputParser()
    )
    raw_answer = chain.invoke({"question": question, "history": _history_to_messages(history)})

    # Guardrails: PII redaction, then an independent LLM judge for
    # groundedness/toxicity — deliberately separate from the generation
    # prompt's own "don't hallucinate" instruction (defense in depth).
    answer, pii_found = redact_pii(raw_answer)
    verdict = judge_response(context=context, answer=answer, llm=llm)

    if not verdict.grounded:
        answer = "У мене немає цієї інформації в базі знань."
    elif verdict.toxic:
        answer = "Не можу надати відповідь на це питання."

    log_interaction(
        question=question,
        role=role,
        sources=sources,
        answer=answer,
        grounded=verdict.grounded,
        toxic=verdict.toxic,
        pii_found=pii_found,
    )

    return answer, sources
