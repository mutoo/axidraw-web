import { createPathCommand, normalize } from './utils.js';
import { transformerXY } from './transformers.js';
import { stepXY } from './steppers.js';

export default createPathCommand('L', function* (command, params, context) {
  if (params.length % 2 === 1) {
    throw new Error(`invalid L command: ${params}`);
  }
  const totalXY = params.reduce(
    (total, p, i) => {
      if (i % 2 === 0) {
        return [total[0] + p, total[1]];
      }
      return [total[0], total[1] + p];
    },
    [0, 0],
  );
  yield normalize(command, totalXY, context, stepXY, transformerXY);
});
