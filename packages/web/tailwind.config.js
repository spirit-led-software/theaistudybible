/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        homepage: "url('/background-home.jpg')",
      },
      fontFamily: {
        kanit: ["var(--font-kanit)"],
        catamaran: ["var(--font-catamaran)"],
      },
    },
  },
  plugins: [require("tailwindcss-brand-colors")],
};