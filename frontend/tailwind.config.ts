import type { Config } from "tailwindcss";

/**
 * Design tokens from the approved UI specification (mirrored as CSS variables in app/globals.css).
 * Never hardcode hex values in components — use these tokens.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#142354",
          800: "#1D326B",
          700: "#29427D",
        },
        gold: {
          500: "#D3AE5B",
          600: "#B99243",
          100: "#F5EBD4",
        },
        background: {
          primary: "#F1F1EF",
          secondary: "#E8E8E5",
        },
        surface: "#FFFFFF",
        text: {
          primary: "#142354",
          secondary: "#666D7A",
          inverse: "#FFFFFF",
        },
        border: {
          DEFAULT: "#DEDCD5",
          accent: "#D3AE5B",
        },
        state: {
          success: "#35705A",
          warning: "#9A6D23",
          error: "#B64646",
        },
      },
      borderRadius: {
        input: "8px",
        card: "12px",
        modal: "16px",
        badge: "6px",
      },
      boxShadow: {
        card: "0 4px 16px rgba(20, 35, 84, 0.06)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      keyframes: {
        dot: {
          "0%,60%,100%": { opacity: "0.25", transform: "translateY(0)" },
          "30%": { opacity: "1", transform: "translateY(-3px)" },
        },
        fadeup: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        dot: "dot 1.1s infinite",
        fadeup: "fadeup 200ms ease both",
      },
    },
  },
  plugins: [],
};

export default config;
