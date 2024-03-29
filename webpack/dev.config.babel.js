import { merge } from 'webpack-merge';
import fs from 'fs';
import path from 'path';
import webpack from 'webpack';
import ReactRefreshPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import base from './config/base';
import setupWebSocket from '../server/ws';

const key = fs.readFileSync(
  path.resolve(__dirname, '../server/cert/localhost.key'),
);
const cert = fs.readFileSync(
  path.resolve(__dirname, '../server/cert/localhost.crt'),
);

const port = process.env.AXIDRAW_WEB_PORT ?? 8443;

export default merge(base, {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    hot: true,
    injectClient: true,
    lazy: false,
    open: true,
    openPage: [`https://localhost:${port}`],
    // allow public access in LAN
    disableHostCheck: true,
    host: '0.0.0.0',
    port,
    https: {
      key,
      cert,
    },
    transportMode: 'sockjs',
    setup: (app, server) => {
      // wait a frame so that the listeningApp is set up.
      process.nextTick(() => {
        setupWebSocket(app, server.listeningApp);
      });
    },
  },
  plugins: [new webpack.HotModuleReplacementPlugin(), new ReactRefreshPlugin()],
});
