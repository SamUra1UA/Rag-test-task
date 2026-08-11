"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { ALLOWED_EXTENSIONS } from "@/lib/config";
import type { Role, UploadResponse } from "@/lib/types";

/** POST /documents — client-side validation mirrors backend ALLOWED_EXTENSIONS. */
export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  /** Responses accumulated in this session — the backend has no list endpoint. */
  const [indexed, setIndexed] = useState<UploadResponse[]>([]);
  const [last, setLast] = useState<UploadResponse | null>(null);

  const upload = useCallback(async (file: File, accessLevel: Role) => {
    const dot = file.name.lastIndexOf(".");
    const ext = dot === -1 ? "" : file.name.slice(dot).toLowerCase();
    if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
      setLast(null);
      setError(
        new Error(
          `Непідтримуваний тип файлу «${ext || "без розширення"}». Дозволені: ${ALLOWED_EXTENSIONS.join(", ")}`
        )
      );
      return false;
    }

    setUploading(true);
    setError(null);
    setLast(null);
    try {
      const res = await api.uploadDocument(file, accessLevel);
      setLast(res);
      setIndexed((prev) => [...prev, res]);
      return true;
    } catch (e) {
      setError(e);
      return false;
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading, error, indexed, last, clearError: () => setError(null) };
}
