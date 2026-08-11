/**
 * Contracts derived 1:1 from the FastAPI backend (backend/main.py, backend/rag.py,
 * backend/audit_log.py). Do not add fields the backend does not return.
 */

/** backend/rag.py — VALID_ROLES: doubles as employee role and document access level. */
export const ROLES = ["all", "hr", "finance", "it"] as const;
export type Role = (typeof ROLES)[number];

/** POST /chat — ChatRequest */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  question: string;
  history: ChatMessage[];
  role: Role;
}

/** POST /chat — ChatResponse */
export interface ChatResponse {
  answer: string;
  sources: string[];
}

/** POST /documents — UploadResponse */
export interface UploadResponse {
  filename: string;
  chunks_indexed: number;
  access_level: Role;
}

/** GET /audit — one line of audit_log.log_interaction() */
export interface AuditEntry {
  timestamp: number;
  role: Role;
  question: string;
  sources: string[];
  answer: string;
  grounded: boolean;
  toxic: boolean;
  pii_found: boolean;
}

export interface AuditResponse {
  entries: AuditEntry[];
}

/** GET /health */
export interface HealthResponse {
  status: string;
}
