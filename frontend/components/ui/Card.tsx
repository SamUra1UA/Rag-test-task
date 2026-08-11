export function Card({
  children,
  className = "",
  elevated = false,
}: {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
}) {
  return (
    <div
      className={`rounded-card border border-border bg-surface ${
        elevated ? "shadow-card" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
