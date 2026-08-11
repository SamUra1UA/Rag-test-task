type Tone = "neutral" | "gold" | "success" | "warning" | "error";

const TONES: Record<Tone, string> = {
  neutral: "border border-border bg-background-primary text-text-secondary",
  gold: "border border-border-accent bg-gold-100 text-[#7e5a1d]",
  success: "bg-state-success/10 text-[#2c5f4c]",
  warning: "bg-state-warning/[0.12] text-[#7e5a1d]",
  error: "bg-state-error/[0.12] text-[#9b3b3b]",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-badge px-2.5 py-1 text-xs font-semibold leading-4 ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
