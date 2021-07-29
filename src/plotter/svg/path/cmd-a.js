import { createPathCommand, normalize } from './utils';
import { transformerXY } from './transformers';
import { stepXY } from './steppers';

export default createPathCommand('A', function* (command, context) {
  const [cmd, ...params] = command;
  for (const param of params) {
    yield normalize(cmd, param, context, stepXY, transformerXY);
  }
});
