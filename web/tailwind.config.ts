import type { Config } from "tailwindcss";

const v = (n: string) => `rgb(var(--${n}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class", // never applied: the site keeps its yellow theme everywhere
  theme: {
    extend: {
      colors: {
        sun: v("sun"), honey: v("honey"), paper: v("paper"), card: v("card"),
        ink: v("ink"), navy: v("ink"), gold: v("sun"), "on-sun": v("ink"), muted: v("muted"), line: v("line"), sindoor: v("sindoor"),
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      keyframes: {
        marquee: { to: { transform: "translateX(-50%)" } },
        marqueeR: { from: { transform: "translateX(-50%)" }, to: { transform: "translateX(0)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        spin: { to: { transform: "rotate(360deg)" } },
        wordup: { from: { transform: "translateY(110%)" }, to: { transform: "none" } },
        blob: { "0%,100%": { transform: "translate(0,0) scale(1)" }, "33%": { transform: "translate(8%,-6%) scale(1.15)" }, "66%": { transform: "translate(-6%,8%) scale(.9)" } },
        rise: { from: { opacity: "0", transform: "translateY(24px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        marquee: "marquee 60s linear infinite",
        marqueeR: "marqueeR 60s linear infinite",
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin 40s linear infinite",
        wordup: "wordup .9s cubic-bezier(.2,.8,.2,1) both",
        blob: "blob 18s ease-in-out infinite",
        rise: "rise .8s cubic-bezier(.2,.7,.2,1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
