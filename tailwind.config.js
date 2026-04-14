/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#026B4D",
        "green-brand-light": "#0C9870",
        "green-brand": "#026B4D",
        "green-brand-dark": "#015941",
        "green-brand-darker": "#0A6650",
      },
    },
  },
  plugins: [],
};
