/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#0A8C66",
        "green-brand-light": "#0A8C66",
        "green-brand": "#20604C",
        "green-brand-dark": "#1a5242",
        "green-brand-darker": "#143d31",
        "brand-teal": "#0A8C66",
        "brand-forest": "#20604C",
      },
    },
  },
  plugins: [],
};
