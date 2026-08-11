"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Status = "checking" | "online" | "offline";

/** Polls GET /health so the shell can show real backend availability. */
export function useHealth(intervalMs = 30000) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const res = await api.health();
        if (active) setStatus(res.status === "ok" ? "online" : "offline");
      } catch {
        if (active) setStatus("offline");
      }
    };
    check();
    const id = window.setInterval(check, intervalMs);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [intervalMs]);

  return status;
}
