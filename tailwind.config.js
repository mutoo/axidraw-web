const forms = require('@tailwindcss/forms');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'jit' : undefined,
  purge: ['./src/**/*.html', './src/**/*.js'],
  darkMode: 'class',
  theme: {
    colors: {
      black: '#333',
      white: '#FFF',
    },
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [forms],
};
