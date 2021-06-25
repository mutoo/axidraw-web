import { createPathCommand, normalize, sum } from './utils.js';
import { transformerY } from './transformers.js';
import { stepY } from './steppers.js';

export default createPathCommand('V', function* (command, params, context) {
  if (params.length !== 1) {
    throw new Error(`invalid V command: ${params}`);
  }
  yield normalize(command, [sum(params)], context, stepY, transformerY);
});
