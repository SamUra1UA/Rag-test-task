import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "destructive";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gold-500 text-navy-900 hover:bg-gold-600 disabled:bg-background-secondary disabled:text-[#8a8f99]",
  secondary:
    "bg-surface text-navy-900 border border-navy-900 hover:bg-gold-100 disabled:border-border disabled:text-[#8a8f99] disabled:hover:bg-surface",
  destructive:
    "bg-state-error text-text-inverse hover:brightness-95 disabled:opacity-60",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...rest}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-input px-6 text-[15px] font-semibold transition-colors duration-200 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    >
      {loading && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
