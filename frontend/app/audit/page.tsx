"use client";

import { useState } from "react";
import { useAudit } from "@/hooks/useAudit";
import { ROLE_LABELS, formatDate, formatTime } from "@/lib/roles";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ErrorNotice } from "@/components/ui/Notice";
import { SkeletonRows } from "@/components/ui/Skeleton";

const LIMITS = [
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "50", label: "50" },
];

export default function AuditPage() {
  const [limit, setLimit] = useState("20");
  const { entries, loading, error, reload } = useAudit(Number(limit));

  return (
    <section className="flex-1 overflow-auto px-5 py-8 pb-12 lg:px-10">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
        <div className="flex flex-wrap items-end gap-4">
          <Select
            id="limit"
            label="Кількість записів (limit)"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            options={LIMITS}
            className="min-w-[140px]"
          />
          <Button variant="secondary" onClick={reload} loading={loading} className="min-h-[44px]">
            Оновити
          </Button>
          <span className="meta-text ml-auto">GET /audit?limit={limit}</span>
        </div>

        {error ? <ErrorNotice error={error} onRetry={reload} /> : null}

        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="hidden gap-4 bg-navy-900 px-5 py-3 md:flex">
            <span className="w-[88px] shrink-0 text-xs font-bold uppercase tracking-[0.04em] text-white/65">
              Час
            </span>
            <span className="w-[120px] shrink-0 text-xs font-bold uppercase tracking-[0.04em] text-white/65">
              Роль
            </span>
            <span className="min-w-[280px] flex-1 text-xs font-bold uppercase tracking-[0.04em] text-white/65">
              Питання та відповідь
            </span>
            <span className="w-[230px] shrink-0 text-xs font-bold uppercase tracking-[0.04em] text-white/65">
              Guardrails
            </span>
          </div>

          {loading && entries.length === 0 && <SkeletonRows rows={4} />}

          {!loading && !error && entries.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
              <span className="text-base font-semibold leading-6 text-navy-900">
                Аудит-лог порожній
              </span>
              <span className="text-sm leading-5 text-text-secondary">
                Кожне питання в чаті додає запис із роллю, джерелами та вердиктом guardrails.
              </span>
            </div>
          )}

          {entries.map((entry, i) => (
            <div
              key={`${entry.timestamp}-${i}`}
              className="flex flex-wrap items-start gap-x-4 gap-y-3 border-b border-background-secondary px-5 py-4 last:border-b-0"
            >
              <span className="w-[88px] shrink-0 pt-0.5 text-xs font-medium leading-4 text-text-secondary">
                <span className="md:hidden">{formatDate(entry.timestamp)} </span>
                {formatTime(entry.timestamp)}
              </span>
              <span className="w-[120px] shrink-0 pt-0.5 text-xs font-semibold leading-4 text-navy-800">
                {ROLE_LABELS[entry.role] ?? entry.role}
              </span>
              <div className="flex min-w-[280px] flex-1 flex-col gap-1.5">
                <span className="break-words text-sm font-semibold leading-5 text-navy-900">
                  {entry.question}
                </span>
                <span className="break-words text-sm leading-5 text-text-secondary">
                  {entry.answer}
                </span>
                <span className="break-words text-xs font-medium leading-4 text-[#8a8f99]">
                  Джерела: {entry.sources.length ? entry.sources.join(", ") : "—"}
                </span>
              </div>
              <div className="flex max-w-[230px] flex-1 flex-wrap content-start gap-1.5">
                <Badge tone={entry.grounded ? "success" : "warning"}>
                  {entry.grounded ? "grounded" : "not grounded"}
                </Badge>
                {entry.pii_found && <Badge tone="gold">pii redacted</Badge>}
                {entry.toxic && <Badge tone="error">toxic</Badge>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
