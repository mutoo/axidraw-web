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

export type Command<T> = {
  cmd: string;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: (...params: any[]) => CommandGenerator<T>;
  version?: string;
  execution?: number;
};
