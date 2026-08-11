"""Audit log: append-only record of every chat interaction (request, answer,
sources, and the guardrail verdict), matching the "Audit Log" sink in the
proposed architecture. Logging must never break the chat response itself,
so failures here are swallowed rather than raised.
"""

import json
import os
import time

AUDIT_LOG_PATH = os.getenv("AUDIT_LOG_PATH", "/app/data/audit.log")


def log_interaction(
    *,
    question: str,
    role: str,
    sources: list[str],
    answer: str,
    grounded: bool,
    toxic: bool,
    pii_found: bool,
) -> None:
    entry = {
        "timestamp": time.time(),
        "role": role,
        "question": question,
        "sources": sources,
        "answer": answer,
        "grounded": grounded,
        "toxic": toxic,
        "pii_found": pii_found,
    }
    try:
        os.makedirs(os.path.dirname(AUDIT_LOG_PATH), exist_ok=True)
        with open(AUDIT_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except OSError:
        pass


def read_recent(limit: int = 20) -> list[dict]:
    if not os.path.exists(AUDIT_LOG_PATH):
        return []
    with open(AUDIT_LOG_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()
    return [json.loads(line) for line in lines[-limit:] if line.strip()]
