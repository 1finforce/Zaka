import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  safelist: [{ pattern: /bg-(peri|peach|mint|butter|blush|lilac|sky)/ }],
  // hover styles only on devices that can hover, so taps don't leave them stuck on phones
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        bg: "#F6F2EC", panel: "#FFFDFA", line: "#E8E0D6", ink: "#33302C", muted: "#8B847A",
        mint: { DEFAULT: "#CFE6D6", vivid: "#5FBF88", ink: "#2F5A42" }, peach: { DEFAULT: "#F6D3C1", vivid: "#F09A72", ink: "#8A452B" },
        peri: { DEFAULT: "#D2D6F0", vivid: "#7C86E0", ink: "#3C4589" }, butter: { DEFAULT: "#F3E6B8", vivid: "#E9C64A", ink: "#6E5714" },
        blush: { DEFAULT: "#F0CBD3", vivid: "#E57F98", ink: "#833A4E" }, lilac: { DEFAULT: "#E3D3EC", vivid: "#B48AD6", ink: "#5E3B78" },
        sky: { DEFAULT: "#CFE2EE", vivid: "#64AEDB", ink: "#2C5A73" },
      },
      fontFamily: { sans: ["var(--font-manrope)", "system-ui", "sans-serif"], display: ["var(--font-fraunces)", "Georgia", "serif"] },
      borderRadius: { xl2: "18px" },
      boxShadow: {
        soft: "0 1px 2px rgba(51,48,44,.04), 0 12px 32px -16px rgba(51,48,44,.18)",
        pop: "0 8px 20px -8px rgba(60,69,137,.55)",
      },
    },
  },
  plugins: [],
} satisfies Config;
