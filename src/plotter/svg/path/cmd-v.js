import { createPathCommand, normalize } from './utils';
import { transformerY } from './transformers';
import { stepY } from './steppers';

export default createPathCommand('V', function* (command, context) {
  const [cmd, ...coordinates] = command;
  for (const coordinate of coordinates) {
    yield normalize(cmd, [coordinate], context, stepY, transformerY);
  }
});
