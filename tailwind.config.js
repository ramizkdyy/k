/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#208b3a",
        "green-brand-light": "#25a244",
        "green-brand": "#208b3a",
        "green-brand-dark": "#1a7431",
        "green-brand-darker": "#155d27",
      },
    },
  },
  plugins: [],
};
