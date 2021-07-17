import { decode } from '../utils';
import handleErrorMessage from './error';

export default function* handleEBBMessages(commandQueue) {
  let buffer = [];
  let errorHandler = null;
  while (true) {
    const dataIn = yield;
    buffer.push(...new Uint8Array(dataIn));
    // data arrived
    while (buffer.length) {
      if (commandQueue.length) {
        if (buffer[0] === '!'.charCodeAt(0)) {
          if (!errorHandler) {
            errorHandler = handleErrorMessage();
            errorHandler.next(); // set ready
          }
        }
        const cmd = commandQueue[0];
        const handler = errorHandler || cmd.parser;
        // pass the current buffer to cmd,
        // and let it consume what it needs.
        const cmdStatus = handler.next(buffer);
        const { result, consumed } = cmdStatus.value;
        if (consumed) {
          buffer = buffer.slice(consumed);
        }
        if (cmdStatus.done) {
          if (handler === errorHandler) {
            errorHandler = null;
            cmd.reject(result);
          } else {
            // eslint-disable-next-line no-console
            console.debug(`Received message: ${result}`);
            cmd.resolve(result);
          }
          commandQueue.shift();
        }
      } else {
        const garbage = decode(buffer);
        // eslint-disable-next-line no-console
        console.debug(`Discard garbage message: ${garbage}`);
        buffer.length = 0;
      }
    }
  }
}
