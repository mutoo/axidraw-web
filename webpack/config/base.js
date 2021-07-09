// this webpack configure is inspired by survivejs' webpack book
// link: https://survivejs.com/webpack/foreword/

import { merge } from 'webpack-merge';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { loadCss, loadJavascript } from './parts';

export default merge([
  {
    entry: './src/index.js',
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: './src/pages/index.html',
      }),
      new HtmlWebpackPlugin({
        filename: 'debugger.html',
        template: './src/pages/debugger.html',
      }),
    ],
  },
  loadJavascript(),
  loadCss(),
]);
