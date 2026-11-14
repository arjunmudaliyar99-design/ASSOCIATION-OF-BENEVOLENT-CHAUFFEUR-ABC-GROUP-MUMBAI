import type { Config } from "tailwindcss";

const v = (n: string) => `rgb(var(--${n}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        sun: v("sun"), // dominant yellow surface (navy in dark)
        "on-sun": v("on-sun"),
        paper: v("paper"), // soft yellow surface
        card: v("card"),
        ink: v("ink"),
        muted: v("muted"),
        line: v("line"),
        gold: v("gold"), // logo yellow, constant
        navy: v("navy"), // logo navy, constant
        sindoor: v("sindoor"), // logo red
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      keyframes: {
        drive: { to: { backgroundPosition: "-64px 0" } },
        marquee: { to: { transform: "translateX(-50%)" } },
        beat: { "0%,100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.04)" } },
      },
      animation: {
        drive: "drive 1.6s linear infinite",
        marquee: "marquee 38s linear infinite",
        beat: "beat 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
