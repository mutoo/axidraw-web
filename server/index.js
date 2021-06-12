import express from 'express';
import https from 'https';
import fs from 'fs';
import WebSocket from 'ws';
import { connectToDevice } from './sp.js';

const app = express();

app.use(express.static('src'));

const options = {
  key: fs.readFileSync('assets/cert/localhost.key'),
  cert: fs.readFileSync('assets/cert/localhost.crt'),
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
      console.debug('Disconnect from EBB');
      port.close();
    });
    ws.send('!connected');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.debug('Failed to connect EBB');
    ws.close(3000, 'Failed to connect EBB');
  }
});
