import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Single locked brand accent — ocean / nori teal
        brand: {
          50: "#E7F4F1",
          100: "#C6E6E0",
          200: "#98D3C9",
          300: "#63BBAE",
          400: "#33A192",
          500: "#138A78",
          600: "#0E7264",
          700: "#0B5A50",
          800: "#0A4840",
          900: "#07302A",
        },
        // Semantic warm (premium fee badges only)
        amber: {
          50: "#FFF4E6",
          100: "#FCE6C4",
          700: "#A65B16",
        },
        sand: "#F3F6F3",
        ink: "#12211E",
      },
      borderRadius: {
        xl: "0.85rem",
        "2xl": "1.15rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(7,48,42,0.04), 0 8px 24px rgba(7,48,42,0.06)",
        bar: "0 -6px 24px rgba(7,48,42,0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
