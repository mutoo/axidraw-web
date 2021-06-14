import { ENDING_CR_NL, ENDING_OK_CR_NL } from './constants.js';

export const toInt = (i) => parseInt(i, 10);

export const createCommand = (title, create, options) => {
  return {
    title,
    create,
    ...options,
  };
};

const decoder = new TextDecoder();
export const decode = (buffer) => decoder.decode(Uint8Array.from(buffer));

const encoder = new TextEncoder();
export const encode = (msg) => encoder.encode(msg);

export const cmdWithOptionalParams = (cmd, ...optional) => {
  let cmdWithParams = cmd;
  for (const param of optional) {
    // ignore all following commands if it's undefined
    if (param === undefined) break;
    cmdWithParams += `,${param}`;
  }
  return `${cmdWithParams}\r`;
};

export const readUntil = function* (ending, dataIn) {
  let buffer = '';
  let foundEnding = -1;
  let consumed = 0;
  let nextDataIn = dataIn;
  do {
    const fragment = decode(nextDataIn);
    buffer += fragment;
    foundEnding = buffer.indexOf(ending);
    if (foundEnding !== -1) {
      foundEnding += ending.length;
      break;
    }
    nextDataIn = yield { consumed: fragment.length };
    consumed += fragment.length;
  } while (foundEnding === -1);
  return {
    result: buffer.substring(0, foundEnding),
    consumed: foundEnding - consumed,
    remain: buffer.substring(foundEnding),
  };
};

export const transformResult = (parsed, fn) => {
  return {
    ...parsed,
    result: fn(parsed.result),
  };
};

export const handleOKMessage = function* (dataIn) {
  const parsed = yield* readUntil(ENDING_OK_CR_NL, dataIn);
  return transformResult(parsed, (result) => result.trim());
};

export const handleErrorMessage = function* () {
  let parsed = null;
  let result = '';
  do {
    const dataIn = yield parsed;
    parsed = yield* readUntil(ENDING_CR_NL, dataIn);
    result += parsed.result;
  } while (parsed.remain[0] === '!');
  return {
    ...parsed,
    result,
  };
};

export const checkVersion = (deviceVersion, cmdVersion) => {
  const [dMajor, dMinor, dPatch] = deviceVersion.split('.');
  const [cMajor, cMinor, cPatch] = cmdVersion.split('.');
  if (cMajor < dMajor) return true;
  if (dMajor < cMajor) return false;
  // cMajor === dMajor
  if (cMinor < dMinor) return true;
  if (dMinor < cMinor) return false;
  // dMinor === dMinor
  return cPatch <= dPatch;
};

export const delay = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const handleEBBMessages = function* (commandQueue) {
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
        const handler = errorHandler || cmd;
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
};