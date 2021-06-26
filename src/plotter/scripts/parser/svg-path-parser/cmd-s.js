import { createPathCommand, normalize } from './utils.js';
import { transformerXYPairs } from './transformers.js';
import { stepXY } from './steppers.js';

export default createPathCommand('S', function* (command, params, context) {
  if (params.length % 4 !== 0) {
    throw new Error(`invalid S command: ${params}`);
  }
  for (let i = 0, len = params.length; i < len; i += 4) {
    yield normalize(
      command,
      params.slice(i, i + 4),
      context,
      stepXY,
      transformerXYPairs,
    );
  }
});
