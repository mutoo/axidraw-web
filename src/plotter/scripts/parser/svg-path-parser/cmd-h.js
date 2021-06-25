import { createPathCommand, normalize, sum } from './utils.js';
import { transformerX } from './transformers.js';
import { stepX } from './steppers.js';

export default createPathCommand('H', function* (command, params, context) {
  if (params.length !== 1) {
    throw new Error(`invalid H command: ${params}`);
  }
  yield normalize(command, [sum(params)], context, stepX, transformerX);
});
