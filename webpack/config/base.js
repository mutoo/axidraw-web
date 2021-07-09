// this webpack configure is inspired by survivejs' webpack book
// link: https://survivejs.com/webpack/foreword/

import { merge } from 'webpack-merge';
import { loadCss, loadJavascript } from './parts';
import { generatePages } from './pages';

export default merge([
  {
    entry: './src/index.js',
  },
  loadJavascript(),
  loadCss(),
  generatePages(),
]);
