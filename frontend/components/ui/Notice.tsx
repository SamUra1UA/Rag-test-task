import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ApiError } from "@/lib/api";

/** Error presentation is never colour-only: icon + title + message text. */
export function ErrorNotice({
  error,
  onRetry,
  className = "",
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const isApi = error instanceof ApiError;
  const title = isApi ? error.title : "Несподівана помилка";
  const status = isApi && error.status > 0 ? ` (HTTP ${error.status})` : "";
  const message = isApi
    ? error.detail || error.message || "Спробуйте ще раз."
    : error instanceof Error
      ? error.message
      : "Спробуйте ще раз.";

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-input border border-l-[3px] border-state-error bg-state-error/5 p-4 ${className}`}
    >
      <AlertCircle aria-hidden className="mt-0.5 h-[18px] w-[18px] shrink-0 text-state-error" />
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold leading-5 text-[#9b3b3b]">
          {title}
          {status}
        </span>
        <span className="text-sm leading-5 text-navy-900">{message}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 min-h-[44px] self-start rounded-input border border-navy-900 px-4 text-sm font-semibold text-navy-900 transition-colors duration-200 hover:bg-gold-100"
          >
            Спробувати ще раз
          </button>
        )}
      </div>
    </div>
  );
}

export function SuccessNotice({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-input border border-l-[3px] border-state-success bg-state-success/5 p-4"
    >
      <CheckCircle2 aria-hidden className="mt-0.5 h-[18px] w-[18px] shrink-0 text-state-success" />
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold leading-5 text-[#2c5f4c]">{title}</span>
        <span className="text-sm leading-5 text-navy-900">{message}</span>
      </div>
    </div>
  );
}
