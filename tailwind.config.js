/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,mdx}", "./src/**/*.{js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        erii: {
          red: "#e11d48",
          paper: "#fdfbf7",
          duck: "#fcd34d",
          ink: "#374151",
        },
        wafu: {
          shu: "#ff4d40",
          paper: "#fbfaf5",
          sumi: "#1a1a1a",
          sakura: "#fedfe1",
          sakuranezumi: "#e6cde3",
          indigo: "#2e4b71",
        },
      },
      fontFamily: {
        hand: ["var(--font-hand)", "var(--font-cn)", "cursive"],
        sans: ["var(--font-ui)", "var(--font-cn)", "ui-sans-serif", "system-ui"],
        serif: ["var(--font-serif-jp)", "var(--font-serif-sc)", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      backgroundImage: {
        "paper-texture":
          'url("https://www.transparenttextures.com/patterns/cream-paper.png")',
        "washi-texture":
          'url("https://www.transparenttextures.com/patterns/natural-paper.png")',
      },
      writingMode: {
        'vertical-rl': 'vertical-rl',
      },
      textOrientation: {
        'upright': 'upright',
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
