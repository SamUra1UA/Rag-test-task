import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="flex max-w-[480px] flex-col items-center gap-3 rounded-card border border-border bg-surface p-10 text-center shadow-card">
        <span className="text-xs font-bold uppercase tracking-[0.06em] text-gold-600">404</span>
        <h2 className="text-2xl font-bold leading-8 text-navy-900">Сторінку не знайдено</h2>
        <p className="text-base leading-6 text-text-secondary">
          Такого розділу немає в системі.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex min-h-[44px] items-center rounded-input border border-navy-900 px-4 text-sm font-semibold text-navy-900 transition-colors duration-200 hover:bg-gold-100 hover:text-navy-900"
        >
          Повернутися до чату
        </Link>
      </div>
    </section>
  );
}
