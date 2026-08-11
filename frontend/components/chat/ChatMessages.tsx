"use client";

import { FileText, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ErrorNotice } from "@/components/ui/Notice";
import type { AssistantTurn, ErrorTurn, UserTurn } from "@/hooks/useChat";

export function UserBubble({ turn }: { turn: UserTurn }) {
  return (
    <div className="flex animate-fadeup justify-end">
      <div className="max-w-[min(620px,85%)] whitespace-pre-wrap text-pretty rounded-[12px_12px_4px_12px] bg-navy-800 px-[18px] py-3.5 text-base leading-6 text-text-inverse">
        {turn.content}
      </div>
    </div>
  );
}

export function AssistantBubble({ turn }: { turn: AssistantTurn }) {
  return (
    <div className="flex max-w-[min(680px,90%)] animate-fadeup flex-col gap-2.5">
      <div className="overflow-hidden rounded-[12px_12px_12px_4px] border border-border bg-surface shadow-card">
        <p className="text-pretty whitespace-pre-wrap px-5 py-[18px] text-base leading-6 text-navy-900">
          {turn.content}
        </p>
        <div className="flex flex-wrap items-center gap-2.5 border-t border-background-secondary bg-[#fbfbfa] px-5 py-3">
          <span className="text-xs font-bold uppercase leading-4 tracking-[0.04em] text-text-secondary">
            Джерела
          </span>
          {turn.sources.length > 0 ? (
            turn.sources.map((src) => (
              <span
                key={src}
                className="inline-flex items-center gap-1.5 rounded-badge border border-border bg-surface px-2.5 py-1 text-xs font-medium leading-4 text-navy-800"
              >
                <FileText aria-hidden className="h-3 w-3 text-gold-500" strokeWidth={2} />
                {src}
              </span>
            ))
          ) : (
            <span className="meta-text">Немає документів, доступних цій ролі</span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-0.5">
        {turn.refused ? (
          <Badge tone="warning">Відповіді немає в доступному контексті</Badge>
        ) : (
          <Badge tone="success">
            <ShieldCheck aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
            Перевірено guardrails
          </Badge>
        )}
        {turn.piiRedacted && <Badge tone="gold">PII приховано</Badge>}
        <span className="meta-text">Записано в аудит-лог</span>
      </div>
    </div>
  );
}

export function ErrorBubble({ turn, onRetry }: { turn: ErrorTurn; onRetry: () => void }) {
  return (
    <div className="max-w-[min(680px,90%)] animate-fadeup">
      <ErrorNotice error={turn.error} onRetry={onRetry} />
    </div>
  );
}

export function PendingBubble({ roleLabel }: { roleLabel: string }) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 self-start rounded-[12px_12px_12px_4px] border border-border bg-surface px-5 py-[18px]"
    >
      <span aria-hidden className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-dot rounded-full bg-gold-500" />
        <span className="h-1.5 w-1.5 animate-dot rounded-full bg-gold-500 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-dot rounded-full bg-gold-500 [animation-delay:300ms]" />
      </span>
      <span className="text-sm font-medium leading-5 text-text-secondary">
        Пошук у документах, доступних ролі «{roleLabel}»…
      </span>
    </div>
  );
}
