import { createPathCommand, normalize } from './utils.js';
import { transformerXY } from './transformers.js';
import { stepXY } from './steppers.js';

export default createPathCommand('A', function* (command, params, context) {
  if (params.length % 7 !== 0) {
    throw new Error(`invalid Q command: ${params}`);
  }
  for (let i = 0, len = params.length; i < len; i += 7) {
    yield normalize(
      command,
      params.slice(i, i + 7),
      context,
      stepXY,
      transformerXY,
    );
  }
});
