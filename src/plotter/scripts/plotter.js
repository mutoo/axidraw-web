/* eslint-disable no-await-in-loop,prefer-destructuring */
import { MOTION_PEN_DOWN, MOTION_PEN_UP } from './planner.js';
import createDevice from '../../device/index.js';
import * as commands from '../../ebb/index.js';
import { xyDist2aaSteps } from '../../math/ebb.js';
import { delay } from '../../utils/time.js';

export default function createPlotter(type) {
  const device = createDevice(type);
  const initialContext = { x: 0, y: 0, pen: MOTION_PEN_UP };
  const ratePenDown = 3000;
  const ratePenUp = 5000;
  let context = { ...initialContext };
  let motions = null;
  const reset = async () => {
    context = { ...initialContext };
    await device.executeCommand(commands.r);
    await device.executeCommand(commands.sp, 1, 500);
  };
  return {
    upload: (m) => {
      motions = m;
    },
    connect: async () => {
      await device.connectDevice();
    },
    disconnect: async () => {
      await device.disconnectDevice();
    },
    reset,
    plot: async () => {
      reset();
      for (const motion of motions) {
        const shouldStop = await device.executeCommand(commands.qb);
        if (shouldStop) {
          await reset();
          break;
        }
        if (context.pen !== motion[4]) {
          await device.executeCommand(commands.sp, motion[4], 500);
          // eslint-disable-next-line prefer-destructuring
          context.pen = motion[4];
        }
        const rate = context.pen === MOTION_PEN_DOWN ? ratePenDown : ratePenUp;
        const dx = motion[2] - context.x;
        const dy = motion[3] - context.y;
        const aa = xyDist2aaSteps({ x: dx, y: dy });
        const t = Math.max(
          1,
          ((Math.sqrt(aa.a1 ** 2 + aa.a2 ** 2) / rate) * 1000) | 0,
        );
        console.debug(`to ${aa.a1}, ${aa.a2} in ${t}ms`);
        await device.executeCommand(commands.sm, t, aa.a1, aa.a2);
        context.x = motion[2];
        context.y = motion[3];
      }
      await delay(1e4);
      await reset();
    },
  };
}
