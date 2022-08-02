/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    ripple: (theme) => ({
      colors: theme("colors"),
    }),
    extend: {},
  },
  plugins: [require("tailwindcss-ripple")()],
};
