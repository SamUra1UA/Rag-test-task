import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "AI-база знань",
  description: "Внутрішня AI-платформа доступу до корпоративних регламентів",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <head>
        {/* Loaded at runtime (not build time) so container builds work without
            network access to Google Fonts. Falls back to system sans-serif. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
