import { Command } from './parser';

export type Context = {
  x: number;
  y: number;
  startX: number;
  startY: number;
  toAbsolute: boolean;
};

export type SingleCommand<C extends Command> = [C[0], C[1]];

/**
 * Walking through the command, and transform from relative to absolute format if needed.
 * Also update the context to record the current position.
 *
 * @param command
 * @param params
 * @param context
 * @param stepper
 * @param transformer
 * @returns {*[]}
 */
export const normalize = <T extends SingleCommand<Command>>(
  command: T[0],
  params: T[1],
  context: Context,
  stepper: (params: T[1], context: Context, isAbsoluteCmd: boolean) => void,
  transformer: (params: T[1], context: Context) => T[1],
): T => {
  const absoluteCmd = command.toUpperCase();
  const isAbsoluteCmd = command === absoluteCmd;
  // if the segment is a absolute cmd or don't need to transform
  // update the current position and return segment without change
  if (isAbsoluteCmd || !context.toAbsolute) {
    stepper(params, context, isAbsoluteCmd);
    return [command, params] as T;
  }

  // else the segment is a relative cmd and need to be transformed
  const transformed = transformer(params, context);
  stepper(transformed, context, true);
  return [absoluteCmd as T[0], transformed] as T;
};
