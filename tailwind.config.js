const forms = require('@tailwindcss/forms');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'jit' : undefined,
  purge: ['./src/**/*.html', './src/**/*.js'],
  darkMode: 'class',
  theme: {
    colors: {
      black: '#333',
      white: '#FFF',
      form: {
        bg: {
          disabled: '#f1eded',
        },
      },
      button: {
        text: {
          disabled: '#cac7c6',
          primary: '#FFF',
        },
        secondary: {
          normal: '#ece9e6',
          hover: '#f5f3f0',
          active: '#dbd7d6',
        },
        primary: {
          normal: '#4fa7ff',
          hover: '#3d93e5',
          active: '#2b83d6',
        },
      },
      alert: {
        text: '#333',
        bg: {
          info: '#ddf7ff',
          warn: '#fde1cb',
          alert: '#ffcbcb',
          success: '#f5ffc3',
        },
      },
    },
    fontFamily: {
      roboto: ['Roboto', 'sans-serif'],
      condensed: ['Roboto Condensed', 'sans-serif'],
    },
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [forms],
};
