// this webpack configure is inspired by survivejs' webpack book
// link: https://survivejs.com/webpack/foreword/

import path from 'path';
import { merge } from 'webpack-merge';
import { EnvironmentPlugin } from 'webpack';
import { loadCss, loadJavascript } from './parts';
import { generatePages } from './pages';

export default merge([
  {
    entry: {
      plotter: './src/index.js',
      debugger: './src/debugger.js',
      composer: './src/composer.js',
    },
    resolve: {
      modules: [path.resolve(__dirname, '../../src'), 'node_modules'],
    },
    plugins: [
      new EnvironmentPlugin({
        NODE_ENV: 'production',
        DEBUG: false,
      }),
    ],
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          commons: {
            name: 'vendors',
            test: /[\\/]node_modules[\\/]/,
          },
        },
      },
    },
  },
  loadJavascript(),
  loadCss(),
  generatePages(),
]);
