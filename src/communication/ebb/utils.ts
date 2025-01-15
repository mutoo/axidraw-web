import Logger from 'js-logger';
import { Command, CommandGenerator } from './command';

export const logger = Logger.get('ebb');

export const toInt = (i: string) => parseInt(i, 10);

export const createCommand = <T>(
  cmd: string,
  title: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: (...params: any[]) => CommandGenerator<T>,
  options: { version?: string; execution?: number } = {},
): Command<T> => {
  return {
    cmd,
    title,
    create,
    ...options,
  };
};

const decoder = new TextDecoder();
export const decode = (buffer: number[]) =>
  decoder.decode(Uint8Array.from(buffer));

const encoder = new TextEncoder();
export const encode = (msg: string) => encoder.encode(msg);

export const cmdWithOptionalParams = (
  cmd: string,
  ...optional: (string | number | undefined)[]
) => {
  let cmdWithParams = cmd;
  for (const param of optional) {
    // ignore all following commands if it's undefined
    if (param === undefined) break;
    cmdWithParams += `,${param}`;
  }
  return `${cmdWithParams}\r`;
};

export const readUntil = function* (
  ending: string,
  dataIn: number[],
): Generator<
  { consumed: number },
  { result: string; consumed: number; remain: string },
  number[]
> {
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
    nextDataIn = yield {
      consumed: fragment.length,
    };
    consumed += fragment.length;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } while (foundEnding === -1);
  return {
    // discard any space at the beginning
    result: buffer.substring(0, foundEnding).trimStart(),
    consumed: foundEnding - consumed,
    remain: buffer.substring(foundEnding),
  };
};

export const transformResult = <T>(
  parsed: { result: string; consumed: number; remain: string },
  fn: (result: string) => T,
): { result: T; consumed: number; remain: string } => {
  return {
    ...parsed,
    result: fn(parsed.result),
  };
};

export const checkVersion = (
  deviceVersion: string,
  cmdVersion: string,
): boolean => {
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
