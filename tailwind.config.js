/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        sand: "#F6F1E8",
        fog: "#FCF9F3",
        clay: "#E4D5C1",
        ink: "#1E2028",
        copper: "#D77A4A",
        sea: "#2F7C7C",
      },
      fontFamily: {
        display: ["Nippo"],
        body: ["SpaceMono"],
      },
    },
  },
  plugins: [],
};
