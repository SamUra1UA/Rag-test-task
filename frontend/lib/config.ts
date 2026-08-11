/** Centralised runtime configuration. No API URL is ever hardcoded in a component. */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"
).replace(/\/+$/, "");

/** Mirrors backend `ALLOWED_EXTENSIONS` in backend/main.py */
export const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"] as const;
