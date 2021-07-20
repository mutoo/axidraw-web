/* eslint-disable no-await-in-loop */
import * as commands from 'communication/ebb';
import { MOTION_PEN_DOWN, MOTION_PEN_UP } from './planner';
import { xyDist2aaSteps } from '../math/ebb';
import { delay } from '../utils/time';
import { logger } from './utils';

export const PLOTTER_STATUS_STANDBY = 'axidraw-web-plotter-status-standby';
export const PLOTTER_STATUS_PAUSED = 'axidraw-web-plotter-status-paused';
export const PLOTTER_STATUS_PLOTTING = 'axidraw-web-plotter-status-plotting';

export const PLOTTER_ACTION_PAUSE = 'axidraw-web-plotter-action-pause';
export const PLOTTER_ACTION_STOP = 'axidraw-web-plotter-action-stop';

export const initialContext = { x: 0, y: 0, a1: 0, a2: 0, pen: MOTION_PEN_UP };

async function* plot({
  device,
  penUpMoveSpeed,
  penDownMoveSpeed,
  motions,
  control,
}) {
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
      logger.debug(`action: pause`);
      await device.executeCommand(commands.sp, 1, 500);
      yield PLOTTER_STATUS_PAUSED;
      await device.executeCommand(commands.sp, 0, 500);
    }
    const shouldStop = action === PLOTTER_ACTION_STOP;
    if (shouldStop) {
      logger.debug(`action: stop`);
    }
    const targetPen = shouldStop ? MOTION_PEN_UP : pen;
    const targetLine = shouldStop ? [context.x, context.y, 0, 0] : line;
    if (context.pen !== targetPen) {
      logger.debug(`pen ${targetPen === MOTION_PEN_UP ? 'up' : 'down'}`);
      await device.executeCommand(commands.sp, targetPen, 500);
      context.pen = targetPen;
    }
    const rate =
      targetPen === MOTION_PEN_DOWN
        ? penDownMoveSpeed.get()
        : penUpMoveSpeed.get();
    const targetAA = xyDist2aaSteps({ x: targetLine[2], y: targetLine[3] });
    const deltaA1 = targetAA.a1 - context.a1;
    const deltaA2 = targetAA.a2 - context.a2;
    const t = Math.ceil((Math.sqrt(deltaA1 ** 2 + deltaA2 ** 2) / rate) * 1000);

    if (t > 0) {
      logger.debug(`step-move: ${deltaA1}, ${deltaA2} in ${t}ms`);
      await device.executeCommand(commands.sm, t, deltaA1, deltaA2);
    }
    context.x = targetLine[2];
    context.y = targetLine[3];
    context.a1 = targetAA.a1;
    context.a2 = targetAA.a2;

    if (shouldStop) {
      logger.debug(`stop plotting`);
      break;
    }
  }
  logger.debug(`pen is homing`);
  await delay(1e4);
  await reset();
  logger.debug(`finished plotting`);
  return PLOTTER_STATUS_STANDBY;
}

export default plot;
