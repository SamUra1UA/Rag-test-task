"use client";

const SUGGESTIONS = [
  "Скільки днів на тиждень можна працювати віддалено?",
  "Куди писати питання щодо компенсацій та бонусів?",
  "Який ліміт добових витрат у відрядженні?",
  "Як часто потрібно змінювати пароль до VPN?",
];

export function ChatEmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex flex-col gap-6 rounded-card border border-border bg-surface p-6 shadow-card lg:p-10">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.06em] text-gold-600">
          Початок сесії
        </span>
        <h2 className="text-2xl font-bold leading-8 text-navy-900">
          Запитайте про внутрішні регламенти компанії
        </h2>
        <p className="max-w-[60ch] text-pretty text-base leading-6 text-text-secondary">
          Відповіді формуються лише з проіндексованих документів, доступних вашій ролі. Кожна
          відповідь проходить перевірку guardrails і потрапляє в аудит-лог.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <span className="field-label">Приклади питань</span>
        <div className="flex flex-wrap gap-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onPick(s)}
              className="min-h-[44px] rounded-input border border-border bg-surface px-4 py-2.5 text-left text-sm font-medium leading-5 text-navy-800 transition-colors duration-200 hover:border-border-accent hover:bg-gold-100"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
