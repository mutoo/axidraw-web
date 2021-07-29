import { resetXY } from './steppers';
import { createPathCommand } from './utils';

export default createPathCommand('Z', function* (command, context) {
  resetXY(null, context);
  yield [context.isAbsolute ? 'Z' : command[0]];
});
