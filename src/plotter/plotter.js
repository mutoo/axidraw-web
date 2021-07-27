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

export function* slopeSegments({ t, stepLong, stepShort }) {
  const absStepShort = Math.abs(stepShort);
  const maxTimeShort = absStepShort * 1310;
  const stepShortDir = Math.sign(stepShort);
  const flatT = Math.floor((t - maxTimeShort) / (absStepShort + 1));
  const stepRateLong = stepLong / t;
  const flatStepLong = Math.floor(stepRateLong * flatT);
  const slopeStopLong = Math.floor(stepRateLong * 1310);
  let remainT = t;
  let remainStopLong = stepLong;
  /**
   *  |         ____
   *  |    ___/
   *  |___/_________
   */
  for (let i = 0, segments = 2 * absStepShort + 1; i < segments; i += 1) {
    if (i % 2 === 0) {
      // flat segment
      if (flatT > 0) {
        yield { time: flatT, longStep: flatStepLong, shortStep: 0 };
        remainT -= flatT;
        remainStopLong -= flatStepLong;
      }
    } else {
      // slope segment
      yield { time: 1310, longStep: slopeStopLong, shortStep: stepShortDir };
      remainT -= 1310;
      remainStopLong -= slopeStopLong;
    }
  }
  // there might be remain step due to Math.floor
  if (remainStopLong > 0) {
    yield {
      time: Math.max(1, remainT),
      longStep: remainStopLong,
      shortStep: 0,
    };
  }
}

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
  let bufferTime = 0;
  try {
    for (const { line, pen } of motions) {
      const shouldPause = await device.executeCommand(commands.qb);
      let action = control.get();
      if (shouldPause || action === PLOTTER_ACTION_PAUSE) {
        logger.debug(`action: pause`);
        await device.executeCommand(commands.sp, 1, 500);
        context.pen = MOTION_PEN_UP;
        action = yield PLOTTER_STATUS_PAUSED;
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
      let t = Math.ceil((Math.sqrt(deltaA1 ** 2 + deltaA2 ** 2) / rate) * 1000);
      const absDeltaA1 = Math.abs(deltaA1);
      const absDeltaA2 = Math.abs(deltaA2);
      const mt1 = absDeltaA1 * 1310;
      const mt2 = absDeltaA2 * 1310;

      if (t > mt1 && t > mt2) {
        t = Math.max(mt1, mt2);
      }

      if (t > mt1 && absDeltaA1 > 0) {
        logger.warn(`Vertical edge occurs: SM,${t},${deltaA1},${deltaA2}`);
        for (const segment of slopeSegments({
          t,
          stepLong: deltaA2,
          stepShort: deltaA1,
        })) {
          await device.executeCommand(
            commands.sm,
            segment.time,
            segment.shortStep,
            segment.longStep,
          );
        }
      } else if (t > mt2 && absDeltaA2 > 0) {
        logger.warn(`Horizontal edge occurs: SM,${t},${deltaA1},${deltaA2}`);
        for (const segment of slopeSegments({
          t,
          stepLong: deltaA1,
          stepShort: deltaA2,
        })) {
          await device.executeCommand(
            commands.sm,
            segment.time,
            segment.longStep,
            segment.shortStep,
          );
        }
      } else if (t > 0) {
        logger.debug(`step-move: ${deltaA1}, ${deltaA2} in ${t}ms`);
        await device.executeCommand(commands.sm, t, deltaA1, deltaA2);
      }
      context.x = targetLine[2];
      context.y = targetLine[3];
      context.a1 = targetAA.a1;
      context.a2 = targetAA.a2;

      bufferTime = t;

      if (shouldStop) {
        logger.debug(`stop plotting`);
        break;
      }
    }

    bufferTime += 3e3;
    logger.debug(`pen is homing: ${bufferTime}`);
    await delay(bufferTime);
  } catch (e) {
    logger.error(e);
  } finally {
    await reset();
    logger.debug(`finished plotting`);
  }
  return PLOTTER_STATUS_STANDBY;
}

export default plot;
