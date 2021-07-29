import { createPathCommand, normalize } from './utils';
import { transformerXY } from './transformers';
import { stepXY } from './steppers';

export default createPathCommand('L', function* (command, context) {
  const [cmd, ...coordinatePairs] = command;
  for (const coordinatePair of coordinatePairs) {
    yield normalize(cmd, [coordinatePair], context, stepXY, transformerXY);
  }
});
