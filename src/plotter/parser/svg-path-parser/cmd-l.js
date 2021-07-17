import { createPathCommand, normalize } from './utils';
import { transformerXY } from './transformers';
import { stepXY } from './steppers';

export default createPathCommand('L', function* (command, params, context) {
  if (params.length % 2 !== 0) {
    throw new Error(`invalid L command: ${params}`);
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
