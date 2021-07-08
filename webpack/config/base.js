// this webpack configure is inspired by survivejs' webpack book
// link: https://survivejs.com/webpack/foreword/

import { merge } from 'webpack-merge';
import * as path from 'path';
import { loadCss, loadJavascript } from './parts';

export default merge([
  {
    entry: path.resolve(__dirname, '../../src/index.js'),
  },
  loadJavascript(),
  loadCss(),
]);
