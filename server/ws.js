import WebSocket from 'ws';
import { connectToDevice, listDevices } from './serial-port';

const authCode = process.env.AXIDRAW_AUTH || 'axidraw-web';

export const WEBSOCKET_STATUS_DISCONNECTED =
  'axidraw_web_ws_status_disconnected';
export const WEBSOCKET_STATUS_CONNECTED = 'axidraw_web_ws_status_connected';
export const WEBSOCKET_STATUS_AUTHORIZED = 'axidraw_web_ws_status_authorized';
export const WEBSOCKET_STATUS_STANDBY = 'axidraw_web_ws_status_standby';

export default function setupWebSocket(app, server) {
  const wss = new WebSocket.Server({ server, path: '/axidraw' });

  wss.on('connection', async (ws) => {
    let wsStatus = WEBSOCKET_STATUS_CONNECTED;
    let port;
    const wsSend = (data) => {
      ws.send(JSON.stringify({ status: wsStatus, ...data }));
    };
    ws.on('message', async (message) => {
      const data = JSON.parse(message);
      switch (data.type) {
        case 'auth':
          if (data.code !== authCode) {
            ws.close(3000, 'Forbidden');
          } else {
            wsStatus = WEBSOCKET_STATUS_AUTHORIZED;
            const EBBs = await listDevices();
            wsSend({ type: 'devices', devices: EBBs });
          }
          break;
        case 'device_id':
          try {
            const { device } = data;
            port = await connectToDevice(device, (resp) => {
              // eslint-disable-next-line no-console
              console.log(`EBB: ${resp}`);
              wsSend({ type: 'ebb', resp });
            });
            if (wsStatus === WEBSOCKET_STATUS_DISCONNECTED) {
              // websocket may disconnect during connecting to device
              return;
            }
            wsStatus = WEBSOCKET_STATUS_STANDBY;
            wsSend({ type: 'ready' });
          } catch (e) {
            // eslint-disable-next-line no-console
            console.log('Failed to connect EBB');
            ws.close(3001, e.toString());
          }
          break;
        case 'command':
          if (port) {
            port.write(data.command);
          } else {
            ws.close(3002, 'Device is not connected');
          }
          break;
        default:
          // eslint-disable-next-line no-console
          console.log(`Unknown message type: ${data.type}`);
          ws.close(3003, 'Unknown message.');
      }
    });

    ws.on('close', () => {
      if (port) {
        // eslint-disable-next-line no-console
        console.log('Disconnect from client, close EBB');
        port.write('R\r');
        port.close();
      }
      wsStatus = WEBSOCKET_STATUS_DISCONNECTED;
    });
  });
}
