"""FastAPI entrypoint for the AI Knowledge Base MVP.

Endpoints:
- POST /documents -> parse, chunk, embed and index an uploaded file (RBAC-tagged)
- POST /chat       -> answer a question using RBAC-scoped retrieval-augmented generation
- GET  /audit      -> inspect recent logged interactions
"""

import os
import shutil
import tempfile

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from audit_log import read_recent
from rag import InvalidRoleError, add_document_to_index, ask_question

app = FastAPI(title="AI Knowledge Base API", version="0.1.0")

# MVP only: wide-open CORS. Restrict allow_origins to the real frontend
# origin(s) before this goes anywhere near production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}


class ChatRequest(BaseModel):
    question: str
    history: list[dict] = []  # [{"role": "user" | "assistant", "content": "..."}]
    role: str = "all"  # simulated RBAC role — see rag.VALID_ROLES


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]


class UploadResponse(BaseModel):
    filename: str
    chunks_indexed: int
    access_level: str


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/documents", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    access_level: str = Form("all"),
) -> UploadResponse:
    filename = file.filename or "untitled"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
        )

    # LangChain's loaders expect a path on disk, so persist the upload to a
    # temp file for the duration of processing, then clean it up.
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        chunks_indexed = add_document_to_index(tmp_path, source_name=filename, access_level=access_level)
    except (InvalidRoleError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        os.remove(tmp_path)

    return UploadResponse(filename=filename, chunks_indexed=chunks_indexed, access_level=access_level.lower())


@app.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question must not be empty")

    try:
        answer, sources = ask_question(payload.question, payload.history, role=payload.role)
    except InvalidRoleError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc

    return ChatResponse(answer=answer, sources=sources)


@app.get("/audit")
def audit(limit: int = 20) -> dict:
    return {"entries": read_recent(limit)}
