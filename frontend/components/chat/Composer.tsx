"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

export function Composer({
  disabled,
  roleLabel,
  value,
  onChange,
  onSubmit,
}: {
  disabled: boolean;
  roleLabel: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);

  return (
    <div className="border-t border-border bg-surface px-5 pb-6 pt-5 lg:px-10">
      <div className="mx-auto flex max-w-[860px] flex-col gap-2.5">
        <div className="flex items-end gap-3">
          <label htmlFor="question" className="sr-only">
            Питання до бази знань
          </label>
          <textarea
            id="question"
            ref={ref}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="Напишіть питання про регламенти, інструкції або FAQ…"
            className="max-h-[140px] min-h-[48px] flex-1 resize-none rounded-input border border-border bg-surface px-4 py-3 text-base leading-[22px] text-navy-900 transition-colors duration-200 hover:border-[#b9b6ac] focus:border-border-accent focus:outline-none focus:ring-4 focus:ring-gold-500/25"
          />
          <Button onClick={onSubmit} disabled={disabled || value.trim().length === 0}>
            Надіслати
          </Button>
        </div>
        <span className="meta-text">
          Enter — надіслати · Shift+Enter — новий рядок · Контекст обмежено роллю «{roleLabel}»
        </span>
      </div>
    </div>
  );
}
