"use client";

import { useRef, useState } from "react";
import { FileText, Lock } from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { useUpload } from "@/hooks/useUpload";
import { ACCESS_OPTIONS, ROLE_LABELS, isRole } from "@/lib/roles";
import { ALLOWED_EXTENSIONS } from "@/lib/config";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { ErrorNotice, SuccessNotice } from "@/components/ui/Notice";
import type { Role } from "@/lib/types";

export default function DocumentsPage() {
  const { role } = useRole();
  const { upload, uploading, error, indexed, last } = useUpload();
  const [file, setFile] = useState<File | null>(null);
  const [accessLevel, setAccessLevel] = useState<Role>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!file) return;
    const ok = await upload(file, accessLevel);
    if (ok) {
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section className="flex-1 overflow-auto px-5 py-8 pb-12 lg:px-10">
      <div className="mx-auto flex max-w-[960px] flex-col gap-8">
        <div className="flex flex-col gap-6 rounded-card border border-border bg-surface p-6 shadow-card">
          <div className="flex flex-col gap-1.5">
            <span className="section-heading">Завантаження документа</span>
            <p className="text-sm leading-5 text-text-secondary">
              Файл буде розібрано, розбито на чанки, векторизовано та проіндексовано з обраним
              рівнем доступу. Дозволені формати: {ALLOWED_EXTENSIONS.join(", ")}.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="file" className="field-label">
                Файл
              </label>
              <input
                id="file"
                ref={inputRef}
                type="file"
                accept={ALLOWED_EXTENSIONS.join(",")}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="min-h-[48px] cursor-pointer rounded-input border border-border bg-surface px-3.5 py-2.5 text-sm text-navy-900 file:mr-3 file:rounded-badge file:border-0 file:bg-background-secondary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-navy-900 focus:border-border-accent focus:outline-none focus:ring-4 focus:ring-gold-500/25"
              />
            </div>
            <Select
              id="access-level"
              label="Рівень доступу"
              value={accessLevel}
              onChange={(e) => {
                if (isRole(e.target.value)) setAccessLevel(e.target.value);
              }}
              options={ACCESS_OPTIONS}
              className="h-12"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button onClick={submit} disabled={!file} loading={uploading}>
              {uploading ? "Парсинг → чанкінг → ембединги…" : "Проіндексувати документ"}
            </Button>
            <span className="meta-text ml-auto">POST /documents</span>
          </div>

          {error ? <ErrorNotice error={error} /> : null}
          {last && !error && (
            <SuccessNotice
              title="Документ проіндексовано"
              message={`${last.filename} · ${last.chunks_indexed} чанків · рівень доступу: ${ROLE_LABELS[last.access_level]}`}
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="section-heading">Проіндексовано в цій сесії</span>
            <span className="meta-text">
              Backend не має ендпоінта переліку документів — показано відповіді POST /documents
            </span>
          </div>

          <div className="overflow-hidden rounded-card border border-border bg-surface">
            {indexed.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm leading-5 text-text-secondary">
                Ще немає проіндексованих документів у цій сесії. Завантажте файл вище — або
                скористайтесь готовими прикладами з каталогу <code>sample-docs/</code>.
              </p>
            ) : (
              indexed.map((doc, i) => {
                const visible = doc.access_level === "all" || doc.access_level === role;
                return (
                  <div
                    key={`${doc.filename}-${i}`}
                    className="flex flex-wrap items-center gap-4 border-b border-background-secondary px-5 py-4 last:border-b-0"
                  >
                    <FileText aria-hidden className="h-[18px] w-[18px] shrink-0 text-navy-800" strokeWidth={1.75} />
                    <span className="min-w-0 break-words text-base font-medium leading-6 text-navy-900">
                      {doc.filename}
                    </span>
                    <Badge tone={doc.access_level === "all" ? "neutral" : "gold"}>
                      {ROLE_LABELS[doc.access_level]}
                    </Badge>
                    <span className="meta-text ml-auto">{doc.chunks_indexed} чанків</span>
                    {!visible && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium leading-4 text-state-warning">
                        <Lock aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
                        Недоступний вашій ролі
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
