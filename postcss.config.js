const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const nested = require('postcss-nested');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  plugins: [autoprefixer, nested, isProduction ? cssnano : null],
};
