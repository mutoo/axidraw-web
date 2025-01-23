import * as fs from 'node:fs';
import * as https from 'node:https';
import { SecureContextOptions } from 'tls';
import * as express from 'express';

import setupWebSocket from './ws';

const app = express();

app.use(express.static('dist'));

// provide CA cert for client to download
app.use('/ca', express.static('server/cert/ca.pem'));

const options: SecureContextOptions = {};

try {
  options.key = fs.readFileSync('server/cert/localhost.key');
  options.cert = fs.readFileSync('server/cert/localhost.crt');
} catch (_e: unknown) {
  console.error('Please create and install the SSL cert first.');
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const server = https.createServer(options, app).listen(8443, '0.0.0.0');

setupWebSocket(app, server);

// log the server address
server.on('listening', () => {
  const addr = server.address();
  if (!addr) {
    console.error('Server address is not available');
    return;
  }
  if (typeof addr === 'string') {
    console.log(`Listening on ${addr}`);
  } else {
    console.log(`Listening on https://${addr.address}:${addr.port}`);
  }
});
