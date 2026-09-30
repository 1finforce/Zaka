import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  safelist: [{ pattern: /bg-(peri|peach|mint|butter|blush|lilac|sky)/ }],
  theme: {
    extend: {
      colors: {
        bg: "#F6F2EC", panel: "#FFFDFA", line: "#E8E0D6", ink: "#33302C", muted: "#8B847A",
        mint: { DEFAULT: "#CFE6D6", ink: "#2F5A42" }, peach: { DEFAULT: "#F6D3C1", ink: "#8A452B" },
        peri: { DEFAULT: "#D2D6F0", ink: "#3C4589" }, butter: { DEFAULT: "#F3E6B8", ink: "#6E5714" },
        blush: { DEFAULT: "#F0CBD3", ink: "#833A4E" }, lilac: { DEFAULT: "#E3D3EC", ink: "#5E3B78" },
        sky: { DEFAULT: "#CFE2EE", ink: "#2C5A73" },
      },
      fontFamily: { sans: ["var(--font-manrope)", "system-ui", "sans-serif"], display: ["var(--font-fraunces)", "Georgia", "serif"] },
      borderRadius: { xl2: "18px" },
    },
  },
  plugins: [],
} satisfies Config;
