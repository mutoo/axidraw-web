import WebSocket from 'ws';
import { connectToDevice } from './sp';

export default function setupWebSocket(app, server) {
  const wss = new WebSocket.Server({ server, path: '/axidraw' });

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
}
