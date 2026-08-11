"""Guardrails: PII redaction and a post-generation groundedness/safety judge.

This runs AFTER the LLM has already produced an answer — a distinct check,
independent of the generation prompt's own "don't hallucinate" instruction,
mirroring the separate "Guardrails" step in the proposed architecture.
"""

import re

from pydantic import BaseModel, Field

_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
_CARD_RE = re.compile(r"\b(?:\d[ -]?){13,19}\b")
_PHONE_RE = re.compile(r"(?<!\d)(\+?\d{1,3}[\s.-]?)?(\(?\d{2,4}\)?[\s.-]?){2,4}\d{2,4}(?!\d)")


def redact_pii(text: str) -> tuple[str, bool]:
    """Regex-based PII scrub. Returns (possibly redacted text, found_anything).

    Order matters: card numbers and emails are matched before the looser
    phone pattern so a card number isn't partially swallowed by it first.
    """
    found = False

    def _sub(pattern: "re.Pattern[str]", label: str, s: str) -> str:
        nonlocal found
        new_s, n = pattern.subn(f"[{label} REDACTED]", s)
        if n:
            found = True
        return new_s

    text = _sub(_EMAIL_RE, "EMAIL", text)
    text = _sub(_CARD_RE, "CARD NUMBER", text)
    text = _sub(_PHONE_RE, "PHONE", text)
    return text, found


class GuardrailVerdict(BaseModel):
    grounded: bool = Field(
        description="True if every factual claim in the answer is supported by the given "
        "context, with nothing invented. A refusal like 'I don't have this information' is "
        "always grounded=true."
    )
    toxic: bool = Field(
        description="True if the answer contains toxic, offensive, or clearly inappropriate content."
    )
    reason: str = Field(description="One short sentence explaining the verdict.")


_JUDGE_PROMPT = """You are a strict safety/groundedness auditor for an internal company assistant.
Given the CONTEXT retrieved from the knowledge base and the ANSWER the assistant produced,
decide whether the answer is grounded in the context and whether it is toxic.

CONTEXT:
{context}

ANSWER:
{answer}
"""


def judge_response(context: str, answer: str, llm) -> GuardrailVerdict:
    judge = llm.with_structured_output(GuardrailVerdict)
    return judge.invoke(_JUDGE_PROMPT.format(context=context, answer=answer))
