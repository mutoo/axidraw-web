import L from './cmd-l';
import { stepXY, storeXY } from './steppers';
import { transformerXY } from './transformers';
import { createPathCommand, normalize } from './utils';

export default createPathCommand('M', function* (command, params, context) {
  const [x, y, ...rest] = params;
  yield normalize(
    command,
    [x, y],
    context,
    // eslint-disable-next-line no-shadow
    (...params) => {
      stepXY(...params);
      storeXY(...params);
    },
    transformerXY,
  );
  if (rest.length) {
    yield* L.parse({ M: 'L', m: 'l' }[command], rest, context);
  }
});
