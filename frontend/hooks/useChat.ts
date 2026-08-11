"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import type { ChatMessage, Role } from "@/lib/types";

export interface AssistantTurn {
  kind: "assistant";
  content: string;
  sources: string[];
  /** Backend refusal string from rag.py when the guardrail judge rejects grounding. */
  refused: boolean;
  /** True when the answer contains guardrail redaction markers. */
  piiRedacted: boolean;
  at: number;
}

export interface UserTurn {
  kind: "user";
  content: string;
  at: number;
}

export interface ErrorTurn {
  kind: "error";
  error: unknown;
  at: number;
}

export type Turn = UserTurn | AssistantTurn | ErrorTurn;

const REFUSALS = [
  "У мене немає цієї інформації в базі знань.",
  "Не можу надати відповідь на це питання.",
];

const REDACTION_MARKERS = ["[EMAIL REDACTED]", "[PHONE REDACTED]", "[CARD NUMBER REDACTED]"];

/** Chat state + POST /chat. History is sent exactly in the backend's shape. */
export function useChat(role: Role) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);

  const ask = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || pending) return;

      const history: ChatMessage[] = turns
        .filter((t): t is UserTurn | AssistantTurn => t.kind !== "error")
        .map((t) => ({
          role: t.kind === "user" ? "user" : "assistant",
          content: t.content,
        }));

      setTurns((prev) => [...prev, { kind: "user", content: trimmed, at: Date.now() }]);
      setPending(true);

      try {
        const res = await api.chat({ question: trimmed, history, role });
        setTurns((prev) => [
          ...prev,
          {
            kind: "assistant",
            content: res.answer,
            sources: res.sources ?? [],
            refused: REFUSALS.includes(res.answer.trim()),
            piiRedacted: REDACTION_MARKERS.some((m) => res.answer.includes(m)),
            at: Date.now(),
          },
        ]);
      } catch (error) {
        setTurns((prev) => [...prev, { kind: "error", error, at: Date.now() }]);
      } finally {
        setPending(false);
      }
    },
    [pending, role, turns]
  );

  const retry = useCallback(() => {
    const lastUser = [...turns].reverse().find((t): t is UserTurn => t.kind === "user");
    if (!lastUser) return;
    setTurns((prev) => {
      const next = [...prev];
      if (next[next.length - 1]?.kind === "error") next.pop();
      return next;
    });
    void ask(lastUser.content);
  }, [ask, turns]);

  return { turns, pending, ask, retry };
}
