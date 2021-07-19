/* eslint-disable no-await-in-loop */
import * as commands from 'communication/ebb';
import { MOTION_PEN_UP } from './planner';
import { xyDist2aaSteps } from '../math/ebb';
import { delay } from '../utils/time';

export const PLOTTER_STATUS_STANDBY = 'axidraw-web-plotter-status-standby';
export const PLOTTER_STATUS_PAUSED = 'axidraw-web-plotter-status-paused';
export const PLOTTER_STATUS_PLOTTING = 'axidraw-web-plotter-status-plotting';

export const PLOTTER_ACTION_PAUSE = 'axidraw-web-plotter-action-pause';
export const PLOTTER_ACTION_STOP = 'axidraw-web-plotter-action-stop';

export const initialContext = { x: 0, y: 0, pen: MOTION_PEN_UP };

async function* plot({ device, speed, motions, control }) {
  // this async generator would keep working-in-progress status
  // allow user to pause/resume to work.
  let context = null;
  const reset = async () => {
    context = { ...initialContext };
    await device.executeCommand(commands.r);
    await device.executeCommand(commands.sp, 1, 500);
  };
  await reset();
  for (const { line, pen } of motions) {
    const shouldPause = await device.executeCommand(commands.qb);
    const action = control.get();
    if (shouldPause || action === PLOTTER_ACTION_PAUSE) {
      await device.executeCommand(commands.sp, 1, 500);
      yield PLOTTER_STATUS_PAUSED;
      await device.executeCommand(commands.sp, 0, 500);
    }
    const shouldStop = action === PLOTTER_ACTION_STOP;
    const targetPen = shouldStop ? MOTION_PEN_UP : pen;
    const targetLine = shouldStop ? [context.x, context.y, 0, 0] : line;
    if (context.pen !== targetPen) {
      await device.executeCommand(commands.sp, targetPen, 500);
      context.pen = targetPen;
    }
    const rate = speed.get();
    const dx = targetLine[2] - context.x;
    const dy = targetLine[3] - context.y;
    const aa = xyDist2aaSteps({ x: dx, y: dy });
    const t = Math.max(
      1,
      ((Math.sqrt(aa.a1 ** 2 + aa.a2 ** 2) / rate) * 1000) | 0,
    );
    console.debug(`to ${aa.a1}, ${aa.a2} in ${t}ms`);
    await device.executeCommand(commands.sm, t, aa.a1, aa.a2);
    context.x = targetLine[2];
    context.y = targetLine[3];

    if (shouldStop) {
      break;
    }
  }
  await delay(1e4);
  await reset();
  return PLOTTER_STATUS_STANDBY;
}

export default plot;
