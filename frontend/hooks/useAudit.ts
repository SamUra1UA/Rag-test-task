"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AuditEntry } from "@/lib/types";

/** GET /audit?limit= — the only listing endpoint the backend exposes. */
export function useAudit(limit: number) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.audit(limit);
      // Backend appends chronologically and returns the tail — newest first in UI.
      setEntries([...data].reverse());
    } catch (e) {
      setError(e);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return { entries, loading, error, reload: load };
}
