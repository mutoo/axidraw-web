const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const nested = require('postcss-nested');
const postcssImport = require('postcss-import');
const tailwindcss = require('tailwindcss');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  plugins: [
    postcssImport,
    nested,
    tailwindcss,
    autoprefixer,
    isProduction ? cssnano : null,
  ],
};
