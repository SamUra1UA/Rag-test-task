import { API_BASE_URL } from "./config";
import type {
  AuditEntry,
  AuditResponse,
  ChatMessage,
  ChatResponse,
  HealthResponse,
  Role,
  UploadResponse,
} from "./types";

/** Normalised transport error: every UI error state is driven by this. */
export class ApiError extends Error {
  readonly status: number;
  /** FastAPI `detail` payload, when present. */
  readonly detail?: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }

  /** Human-readable, Ukrainian, mapped by HTTP status. */
  get title(): string {
    switch (this.status) {
      case 0:
        return "Немає зв'язку з сервером";
      case 400:
        return "Некоректний запит";
      case 401:
        return "Потрібна автентифікація";
      case 403:
        return "Доступ заборонено";
      case 404:
        return "Ресурс не знайдено";
      case 422:
        return "Помилка валідації";
      default:
        return this.status >= 500 ? "Помилка сервера" : "Запит не виконано";
    }
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  let detail: string | undefined;
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") detail = body.detail;
    else if (Array.isArray(body?.detail)) {
      // FastAPI/pydantic 422 validation payload
      detail = body.detail
        .map((d: { loc?: (string | number)[]; msg?: string }) =>
          [d.loc?.slice(1).join("."), d.msg].filter(Boolean).join(": ")
        )
        .join("; ");
    }
  } catch {
    /* body was not JSON */
  }
  return new ApiError(detail || response.statusText, response.status, detail);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
      ...init,
    });
  } catch {
    throw new ApiError("Network request failed", 0);
  }
  if (!response.ok) throw await toApiError(response);
  return (await response.json()) as T;
}

export const api = {
  /** GET /health */
  health(): Promise<HealthResponse> {
    return request<HealthResponse>("/health");
  },

  /** POST /chat */
  chat(payload: {
    question: string;
    history: ChatMessage[];
    role: Role;
  }): Promise<ChatResponse> {
    return request<ChatResponse>("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  /** POST /documents (multipart/form-data) */
  uploadDocument(file: File, accessLevel: Role): Promise<UploadResponse> {
    const form = new FormData();
    form.append("file", file);
    form.append("access_level", accessLevel);
    return request<UploadResponse>("/documents", { method: "POST", body: form });
  },

  /** GET /audit?limit= */
  async audit(limit: number): Promise<AuditEntry[]> {
    const data = await request<AuditResponse>(`/audit?limit=${limit}`);
    return data.entries ?? [];
  },
};
