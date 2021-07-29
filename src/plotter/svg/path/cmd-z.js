import { resetXY } from './steppers';
import { createPathCommand } from './utils';

export default createPathCommand('Z', function* (command, params, context) {
  resetXY(params, context);
  yield ['Z'];
});
