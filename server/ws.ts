import { Server } from 'https';
import { Express } from 'express';
import { SerialPort } from 'serialport';
import { WebSocket, WebSocketServer } from 'ws';
import {
  ServerMessage,
  ClientMessage,
} from '../src/communication/device/webscoket-type';
import {
  WEBSOCKET_STATUS_AUTHORIZED,
  WEBSOCKET_STATUS_CONNECTED,
  WEBSOCKET_STATUS_DISCONNECTED,
  WEBSOCKET_STATUS_STANDBY,
} from './consts';
import { connectToDevice, listDevices } from './serial-port';

const authCode = process.env.AXIDRAW_AUTH || 'axidraw-web';

export default function setupWebSocket(_app: Express, server: Server) {
  const wss = new WebSocketServer({ server, path: '/axidraw' });

  wss.on('connection', (ws: WebSocket) => {
    let wsStatus = WEBSOCKET_STATUS_CONNECTED;
    let port: SerialPort | undefined;
    const wsSend = (data: ServerMessage) => {
      if (ws.readyState !== WebSocket.OPEN) {
        console.log('WebSocket is not open');
        return;
      }
      ws.send(JSON.stringify({ status: wsStatus, ...data }));
    };
    ws.on('message', (message: string) => {
      const data = JSON.parse(message) as ClientMessage;
      switch (data.type) {
        case 'auth':
          if (data.code !== authCode) {
            ws.close(3000, 'Forbidden');
          } else {
            wsStatus = WEBSOCKET_STATUS_AUTHORIZED;
            void listDevices().then((EBBs) => {
              wsSend({ type: 'devices', devices: EBBs });
            });
          }
          break;
        case 'device_id':
          void (async () => {
            try {
              const { device } = data;
              port = await connectToDevice(device, (response: Buffer) => {
                console.log(`EBB: ${Array.from(response).join(' ')}`);
                wsSend({ type: 'ebb', response: Array.from(response) });
              });
              if (wsStatus === WEBSOCKET_STATUS_DISCONNECTED) {
                // websocket may disconnect during connecting to device
                return;
              }
              wsStatus = WEBSOCKET_STATUS_STANDBY;
              wsSend({ type: 'ready' });
            } catch (e) {
              console.log('Failed to connect EBB');
              ws.close(3001, String(e));
            }
          })();
          break;
        case 'command':
          if (port) {
            console.log(`Client: ${data.command}`);
            port.write(data.command);
          } else {
            ws.close(3002, 'Device is not connected');
          }
          break;
        default:
          ws.close(3003, 'Unknown message.');
      }
    });
    ws.on('error', (e) => {
      console.error(e.toString());
      ws.close(3005, `Internal Error: ${e.toString()}`);
    });
    ws.on('close', () => {
      if (port) {
        console.log('Disconnect from client, close EBB');
        port.write('R\r');
        port.close();
      }
      wsStatus = WEBSOCKET_STATUS_DISCONNECTED;
    });
  });
}
