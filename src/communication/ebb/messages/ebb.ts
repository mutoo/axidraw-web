import { PendingCommand } from '@/communication/device/utils';
import { decode, logger } from '../utils';
import handleErrorMessage from './error';

export default function* handleEBBMessages(
  commandQueue: PendingCommand<unknown>[],
): Generator<undefined, void, ArrayBufferLike> {
  let buffer: number[] = [];
  let errorHandler = null;
  for (;;) {
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
        const handler = (errorHandler || cmd.parser) as unknown as Generator<
          { consumed: number },
          { result: unknown; consumed: number },
          number[]
        >;
        // pass the current buffer to cmd,
        // and let it consume what it needs.
        const cmdStatus = handler.next(buffer);
        const { consumed } = cmdStatus.value;
        if (consumed) {
          buffer = buffer.slice(consumed);
        }
        if (cmdStatus.done) {
          const { result } = cmdStatus.value;
          if (handler === errorHandler) {
            errorHandler = null;
            cmd.reject(result as string);
          } else {
            logger.debug(`Received message: ${String(result)}`);
            cmd.resolve(result);
          }
          commandQueue.shift();
        }
      } else {
        const garbage = decode(buffer);
        logger.debug(`Discard garbage message: ${garbage}`);
        buffer.length = 0;
      }
    }
  }
}
