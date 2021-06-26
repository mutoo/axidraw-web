import { createPathCommand, normalize } from './utils.js';
import { transformerXY } from './transformers.js';
import { stepXY } from './steppers.js';

export default createPathCommand('T', function* (command, params, context) {
  if (params.length % 2 !== 0) {
    throw new Error(`invalid S command: ${params}`);
  }
  for (let i = 0, len = params.length; i < len; i += 2) {
    yield normalize(
      command,
      params.slice(i, i + 2),
      context,
      stepXY,
      transformerXY,
    );
  }
});
