import { merge } from 'webpack-merge';
import base from './config/base';

export default merge(base, {
  mode: 'development',
});
