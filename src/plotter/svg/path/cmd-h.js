import { createPathCommand, normalize } from './utils';
import { transformerX } from './transformers';
import { stepX } from './steppers';

export default createPathCommand('H', function* (command, context) {
  const [cmd, ...coordinates] = command;
  for (const coordinate of coordinates) {
    yield normalize(cmd, [coordinate], context, stepX, transformerX);
  }
});
