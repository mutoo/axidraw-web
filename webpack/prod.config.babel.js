import { merge } from 'webpack-merge';
import path from 'path';
import base from './config/base';

export default merge(base, {
  mode: 'production',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '../dist'),
  },
});
