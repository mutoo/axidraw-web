import express from 'express';
import https from 'https';
import fs from 'fs';
import setupWebSocket from './ws';

const app = express();

app.use(express.static('src'));

app.use('/node_modules', express.static('node_modules'));

app.use('/assets', express.static('assets'));

app.use('/ca', express.static('scripts/ca.pem'));

const options = {
  key: fs.readFileSync('server/cert/localhost.key'),
  cert: fs.readFileSync('server/cert/localhost.crt'),
};

const server = https.createServer(options, app).listen(8443);

setupWebSocket(app, server);
