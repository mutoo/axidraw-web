import { merge } from 'webpack-merge';
import fs from 'fs';
import path from 'path';
import base from './config/base';

const key = fs.readFileSync(
  path.resolve(__dirname, '../server/cert/localhost.key'),
);
const cert = fs.readFileSync(
  path.resolve(__dirname, '../server/cert/localhost.crt'),
);

const port = process.env.AXIDRAW_WEB_PORT ?? 8443;

export default merge(base, {
  mode: 'development',
  devServer: {
    hot: true,
    lazy: false,
    open: true,
    openPage: [`https://localhost:${port}`],
    // allow public access in LAN
    host: '0.0.0.0',
    port,
    https: {
      key,
      cert,
    },
  },
});
