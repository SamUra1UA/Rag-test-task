import type { SelectHTMLAttributes } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: Option[];
  /** Renders the label above the control instead of visually hiding it. */
  hideLabel?: boolean;
}

export function Select({
  id,
  label,
  options,
  hideLabel = false,
  className = "",
  ...rest
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={hideLabel ? "sr-only" : "field-label"}>
        {label}
      </label>
      <select
        id={id}
        {...rest}
        className={`h-11 min-w-[180px] rounded-input border border-border bg-surface px-3.5 text-[15px] font-medium text-navy-900 transition-colors duration-200 hover:border-[#b9b6ac] focus:border-border-accent focus:outline-none focus:ring-4 focus:ring-gold-500/25 disabled:cursor-not-allowed disabled:bg-background-secondary disabled:text-[#8a8f99] ${className}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
