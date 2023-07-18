/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        kanit: ["var(--font-kanit)"],
        catamaran: ["var(--font-catamaran)"],
      },
    },
  },
  plugins: [require("tailwindcss-brand-colors")],
};
