import { VirtualPlotterContext } from '.';

export type CommandGenerator = AsyncGenerator<string, void, void>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Command<T extends any[]> = {
  cmd: string;
  title: string;
  create: (context: VirtualPlotterContext, ...args: T) => CommandGenerator;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CreateCommand = <T extends any[]>(
  cmd: string,
  title: string,
  create: (context: VirtualPlotterContext, ...args: T) => CommandGenerator,
): Command<T> => {
  return {
    cmd,
    title,
    create,
  };
};
