// this webpack configure is inspired by survivejs' webpack book
// link: https://survivejs.com/webpack/foreword/

import path from 'path';
import { merge } from 'webpack-merge';
import { EnvironmentPlugin } from 'webpack';
import { loadCss, loadJavascript } from './parts';
import { generatePages } from './pages';

export default merge([
  {
    entry: './src/index.js',
    resolve: {
      modules: [path.resolve(__dirname, '../../src'), 'node_modules'],
    },
    plugins: [
      new EnvironmentPlugin({
        NODE_ENV: 'production',
        DEBUG: false,
      }),
    ],
  },
  loadJavascript(),
  loadCss(),
  generatePages(),
]);
