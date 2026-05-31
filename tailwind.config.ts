import type { Config } from "tailwindcss";

// Stoned Goose brand: dark "comedy-club" surfaces with a gold accent.
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Core brand palette (see §8 of the build spec).
        ink: {
          DEFAULT: "#1A1A1A", // primary surface
          900: "#121212", // app background
          800: "#1A1A1A", // cards / panels
          700: "#242424", // raised panels
          600: "#2E2E2E", // borders / hover
        },
        gold: {
          DEFAULT: "#F2C200", // accent
          muted: "#C9A200",
        },
        // Semantic status colors, tuned for the dark theme.
        ok: "#3FB950",
        warn: "#E3B341",
        danger: "#F85149",
        info: "#58A6FF",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "0.875rem",
      },
    },
  },
  plugins: [],
};

export default config;
