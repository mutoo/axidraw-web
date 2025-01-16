import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';
import { cmdWithOptionalParams } from '../utils';

export const cmd = 'PC';

export default createCommand(
  cmd,
  'Pulse configure',
  function* (
    len0: number,
    period0: number,
    len1?: number,
    period1?: number,
    len2?: number,
    period2?: number,
    len3?: number,
    period3?: number,
  ) {
    const dataIn = yield cmdWithOptionalParams(
      `${cmd},${len0.toFixed(0)},${period0.toFixed(0)}`,
      len1,
      period1,
      len2,
      period2,
      len3,
      period3,
    );
    return yield* handleOKMessage(dataIn);
  },
  (
    params: string,
  ): [number, number, number, number, number, number, number, number] => {
    const [len0, period0, len1, period1, len2, period2, len3, period3] = params
      .split(',')
      .map((p) => parseInt(p, 10));
    return [len0, period0, len1, period1, len2, period2, len3, period3];
  },
);
