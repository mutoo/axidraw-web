import express from 'express';
import https from 'https';
import fs from 'fs';
import WebSocket from 'ws';
import { connectToDevice } from './sp.js';

const app = express();

app.use(express.static('src'));

app.use('/assets', express.static('assets'));

app.use('/ca', express.static('server/cert/localhost.crt'));

const options = {
  key: fs.readFileSync('server/cert/localhost.key'),
  cert: fs.readFileSync('server/cert/localhost.crt'),
};

const server = https.createServer(options, app).listen(443);

const wss = new WebSocket.Server({ server });

wss.on('connection', async (ws) => {
  try {
    const port = await connectToDevice((data) => {
      // eslint-disable-next-line no-console
      console.debug(`EBB: ${data}`);
      ws.send(data);
    });
    ws.on('message', (message) => {
      // eslint-disable-next-line no-console
      console.debug(`Client: ${message}`);
      port.write(message);
    });
    ws.on('close', () => {
      // eslint-disable-next-line no-console
      console.debug('Disconnect from client, close EBB');
      port.write('R\r');
      port.close();
    });
    ws.send('!connected');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.debug('Failed to connect EBB');
    ws.close(3000, e.toString());
  }
});
