import { createPathCommand, normalize } from './utils';
import { transformerX } from './transformers';
import { stepX } from './steppers';

export default createPathCommand('H', function* (command, params, context) {
  if (params.length !== 1) {
    throw new Error(`invalid H command: ${params}`);
  }
  for (let i = 0, len = params.length; i < len; i += 1) {
    yield normalize(
      command,
      params.slice(i, i + 1),
      context,
      stepX,
      transformerX,
    );
  }
});
