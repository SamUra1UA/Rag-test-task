import type { Role } from "./types";
import { ROLES } from "./types";

export const ROLE_LABELS: Record<Role, string> = {
  all: "Всі співробітники",
  hr: "HR",
  finance: "Фінанси",
  it: "IT",
};

export const ROLE_OPTIONS = ROLES.map((value) => ({
  value,
  label: ROLE_LABELS[value],
}));

export const ACCESS_OPTIONS = ROLES.map((value) => ({
  value,
  label: value === "all" ? `${ROLE_LABELS[value]} (all)` : `${ROLE_LABELS[value]} (${value})`,
}));

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function formatTime(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function formatDate(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}
