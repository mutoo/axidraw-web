import { createPathCommand, normalize } from './utils';
import { transformerY } from './transformers';
import { stepY } from './steppers';

export default createPathCommand('V', function* (command, params, context) {
  if (params.length !== 1) {
    throw new Error(`invalid V command: ${params}`);
  }
  for (let i = 0, len = params.length; i < len; i += 1) {
    yield normalize(
      command,
      params.slice(i, i + 1),
      context,
      stepY,
      transformerY,
    );
  }
});
