"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText, ListChecks, Menu, MessageSquare, X } from "lucide-react";
import { RoleProvider, useRole } from "@/context/RoleContext";
import { useHealth } from "@/hooks/useHealth";
import { Select } from "@/components/ui/Select";
import { ROLE_OPTIONS, isRole } from "@/lib/roles";

const NAV = [
  { href: "/", label: "Чат", icon: MessageSquare, eyebrow: "Робоча область", title: "Чат із базою знань" },
  { href: "/documents", label: "Документи", icon: FileText, eyebrow: "Індексація", title: "Документи бази знань" },
  { href: "/audit", label: "Аудит-лог", icon: ListChecks, eyebrow: "Комплаєнс", title: "Аудит-лог взаємодій" },
];

const HEALTH_TEXT = {
  checking: "перевірка…",
  online: "працює",
  offline: "недоступний",
} as const;

const HEALTH_DOT = {
  checking: "bg-text-secondary shadow-[0_0_0_3px_rgba(102,109,122,0.2)]",
  online: "bg-state-success shadow-[0_0_0_3px_rgba(53,112,90,0.22)]",
  offline: "bg-state-error shadow-[0_0_0_3px_rgba(182,70,70,0.22)]",
} as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Основна навігація" className="flex flex-col gap-1 px-4">
      <span className="px-3 pb-2 text-xs font-bold uppercase tracking-[0.06em] text-white/35">
        Робоча область
      </span>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-[44px] items-center gap-3 overflow-hidden rounded-input px-3 text-[15px] font-semibold transition-colors duration-200 ${
              active ? "bg-white/[0.09] text-white" : "text-white/70 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            {active && (
              <span aria-hidden className="absolute inset-y-2 left-0 w-[3px] rounded-r-[3px] bg-gold-500" />
            )}
            <Icon aria-hidden className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 border-b border-white/10 p-6">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input bg-gold-500 text-[15px] font-bold text-navy-900">
        KB
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-bold uppercase tracking-[0.03em] text-white">AI-база знань</span>
        <span className="text-xs font-medium text-white/50">Internal Knowledge Platform</span>
      </div>
    </div>
  );
}

function HealthFooter() {
  const status = useHealth();
  return (
    <div className="mt-auto flex flex-col gap-2.5 border-t border-white/10 px-6 pb-6 pt-4">
      <div className="flex items-center gap-2">
        <span aria-hidden className={`h-[7px] w-[7px] shrink-0 rounded-full ${HEALTH_DOT[status]}`} />
        <span className="text-xs font-medium text-white/60">API · {HEALTH_TEXT[status]}</span>
      </div>
      <span className="text-xs font-medium text-white/30">RAG · Chroma · Guardrails v0.1.0</span>
    </div>
  );
}

function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const current = NAV.find((n) => n.href === pathname) ?? NAV[0];
  const { role, setRole } = useRole();

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-x-8 gap-y-4 border-b border-border bg-surface px-5 py-4 lg:px-10 lg:py-5">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Відкрити меню"
        className="flex h-11 w-11 items-center justify-center rounded-input border border-border text-navy-900 lg:hidden"
      >
        <Menu aria-hidden className="h-5 w-5" strokeWidth={1.75} />
      </button>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-[0.06em] text-text-secondary">
          {current.eyebrow}
        </span>
        <h1 className="text-2xl font-bold leading-8 tracking-[-0.01em] text-navy-900">
          {current.title}
        </h1>
      </div>
      <div className="ml-auto">
        <Select
          id="role-select"
          label="Ваша роль (RBAC)"
          value={role}
          onChange={(e) => {
            if (isRole(e.target.value)) setRole(e.target.value);
          }}
          options={ROLE_OPTIONS}
          className="min-w-[200px]"
        />
      </div>
    </header>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="flex min-h-screen bg-background-primary">
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col bg-navy-900 lg:flex">
        <Brand />
        <div className="py-6">
          <NavLinks />
        </div>
        <HealthFooter />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-navy-900/50"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-[264px] flex-col bg-navy-900 transition-transform duration-200">
            <div className="flex items-center justify-between pr-4">
              <div className="flex-1">
                <Brand />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Закрити меню"
              className="absolute right-3 top-6 flex h-11 w-11 items-center justify-center rounded-input text-white/70 hover:text-white"
            >
              <X aria-hidden className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <div className="py-6">
              <NavLinks onNavigate={() => setMenuOpen(false)} />
            </div>
            <HealthFooter />
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMenu={() => setMenuOpen(true)} />
        {children}
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <Shell>{children}</Shell>
    </RoleProvider>
  );
}
