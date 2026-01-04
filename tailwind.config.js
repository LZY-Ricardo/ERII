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
      },
      fontFamily: {
        hand: ["var(--font-hand)", "var(--font-cn)", "cursive"],
        sans: [
          "var(--font-hand)",
          "var(--font-cn)",
          "ui-sans-serif",
          "system-ui",
        ],
      },
      backgroundImage: {
        "paper-texture":
          'url("https://www.transparenttextures.com/patterns/cream-paper.png")',
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
