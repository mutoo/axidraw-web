export const createPathCommand = (command, handle) => ({
  command,
  handle,
});

export const sum = (arr) => arr.reduce((s, a) => s + a, 0);

export const normalize = (command, params, context, stepper, transformer) => {
  const absoluteCmd = command.toUpperCase();
  const isAbsoluteCmd = command === absoluteCmd;
  // if the segment is a absolute cmd or don't need to transform
  // update the current position and return segment without change
  if (isAbsoluteCmd || !context.toAbsolute) {
    stepper(params, context, isAbsoluteCmd);
    return [command, ...params];
  }

  // else the segment is a relative cmd and need to be transformed
  const transformed = transformer(params, context);
  stepper(transformed, context, true);
  return [absoluteCmd, ...transformed];
};
