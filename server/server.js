import express from 'express';
import https from 'https';
import fs from 'fs';

import setupWebSocket from './ws';

const app = express();

app.use(express.static('dist'));

app.use('/assets', express.static('assets'));

// provide CA cert for client to download
app.use('/ca', express.static('server/cert/ca.pem'));

let options;
try {
  options = {
    key: fs.readFileSync('server/cert/localhost.key'),
    cert: fs.readFileSync('server/cert/localhost.crt'),
  };
} catch (e) {
  // eslint-disable-next-line no-console
  console.error('Please create and install the SSL cert first.');
  process.exit(1);
}

const server = https.createServer(options, app).listen(8443);

setupWebSocket(app, server);
