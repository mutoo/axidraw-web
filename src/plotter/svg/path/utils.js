// a helper function to create path command
export const createPathCommand = (type, execute) => ({
  type,
  execute,
});

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
