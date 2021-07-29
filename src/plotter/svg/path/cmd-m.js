import L from './cmd-l';
import { stepXY, storeXY } from './steppers';
import { transformerXY } from './transformers';
import { createPathCommand, normalize } from './utils';

export default createPathCommand('M', function* (command, context) {
  const [cmd, coordinatePair, ...coordinatePairs] = command;
  yield normalize(
    cmd,
    [coordinatePair],
    context,
    // eslint-disable-next-line no-shadow
    (...args) => {
      stepXY(...args);
      storeXY(...args);
    },
    transformerXY,
  );
  // the following coordinate pairs are for line commands
  if (coordinatePairs.length) {
    yield* L.execute([{ M: 'L', m: 'l' }[cmd], ...coordinatePairs], context);
  }
});
