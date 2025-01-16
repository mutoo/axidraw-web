export type UnfinishedMessage = {
  consumed: number;
};

export type FinishedMessage<T> = {
  consumed: number;
  remain: string;
  result: T;
};

export type CommandGenerator<T> = Generator<
  string | UnfinishedMessage,
  FinishedMessage<T>,
  number[]
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Command<T extends any[], R> = {
  cmd: string;
  title: string;
  create: (...params: T) => CommandGenerator<R>;
  parseParams: (params: string) => T;
  version?: string;
  execution?: number;
};

export type ExtractCommandParams<T> = T extends {
  create: (...params: infer P) => CommandGenerator<unknown>;
}
  ? P
  : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CommandWithParams<T extends Command<any[], unknown>> = {
  cmd: T;
  title?: string;
  params: ExtractCommandParams<T>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createCommand = <T extends any[], R>(
  cmd: string,
  title: string,
  create: (...params: T) => CommandGenerator<R>,
  parseParams: (params: string) => T,
  options: { version?: string; execution?: number } = {},
): Command<T, R> => {
  return {
    cmd,
    title,
    create,
    parseParams,
    ...options,
  };
};
