import { createPathCommand, normalize } from './utils';
import { transformerXYPairs } from './transformers';
import { stepXY } from './steppers';

export default createPathCommand('S', function* (command, context) {
  const [cmd, ...params] = command;
  for (const param of params) {
    yield normalize(cmd, param, context, stepXY, transformerXYPairs);
  }
});
