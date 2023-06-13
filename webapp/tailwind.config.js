/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    ripple: (theme) => ({
      colors: theme("colors"),
    }),
    extend: {},
    // colors:{
    //   'primary':{
    //     400:'#2196F3',
    //     600: '#0277BD',
    //     700: '#01579B'
    //   },
    //   'cm-orange': {
    //     50: '#fff7ed',
    //     100: '#ffedd5',
    //     200: '#fed7aa',
    //     300: '#fdba74',
    //     400: '#fb923c',
    //     500: '#f97316',
    //     600: '#ea580c',
    //   },
    //   red: {
    //     not_understood: '#D32F2F',
    //     400: '#ef4444',
    //     500: '#B71C1C',
    //   },
    //   gray: {
    //     200: '#e7ebe5',
    //     400: '#9ca3af'
    //   },
    //   white:'#ffffff',
    //   'chips':{
    //     bg:'#E3F2FD',
    //     txt:'#495057',
    //   },
    //   green: {
    //     understood: '#689F38'
    //   }
    // },
  },
  plugins: [require("tailwindcss-ripple")()],
};
