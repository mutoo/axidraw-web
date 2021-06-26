import { createPathCommand, normalize } from './utils.js';
import { transformerXYPairs } from './transformers.js';
import { stepXY } from './steppers.js';

export default createPathCommand('C', function* (command, params, context) {
  if (params.length % 6 !== 0) {
    throw new Error(`invalid C command: ${params}`);
  }
  for (let i = 0, len = params.length; i < len; i += 6) {
    yield normalize(
      command,
      params.slice(i, i + 6),
      context,
      stepXY,
      transformerXYPairs,
    );
  }
});
