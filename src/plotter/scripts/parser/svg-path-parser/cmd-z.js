import { resetXY } from './steppers.js';
import { createPathCommand } from './utils.js';

export default createPathCommand('Z', function* (command, params, context) {
  resetXY(params, context);
  yield ['Z'];
});
