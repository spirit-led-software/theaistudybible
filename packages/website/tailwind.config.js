/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    fontFamily: {
      catamaran: ["Catamaran"],
    },
    extend: {},
  },
  plugins: [require('tailwindcss-animate'), require("tailwindcss-brand-colors")],
};
