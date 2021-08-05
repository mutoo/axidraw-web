/* eslint-disable no-await-in-loop */
import * as commands from 'communication/ebb';
import {
  MOTION_PEN_DOWN,
  MOTION_PEN_UP,
  PLOTTER_ACTION_PAUSE,
  PLOTTER_ACTION_STOP,
  PLOTTER_SPEED_MODE_CONSTANT,
  PLOTTER_STATUS_PAUSED,
  PLOTTER_STATUS_STANDBY,
} from './consts';
import { xyDist2aaSteps } from '../math/ebb';
import { delay } from '../utils/time';
import { logger } from './utils';
import { slopeSegments } from './motion/const-velocity';
import {
  accelMotion,
  accMotion2LMParams,
  estimateExitRate,
} from './motion/const-acceleration';

export const initialContext = {
  x: 0,
  y: 0,
  a1: 0,
  a2: 0,
  rate: 0,
  pen: MOTION_PEN_UP,
};

async function* plot({
  device,
  speedMode,
  penUpMoveSpeed,
  penDownMoveSpeed,
  penDownMoveAccel,
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
    await device.executeCommand(commands.sr, 60e3);
  };
  await reset();
  let bufferTime = 0;
  try {
    for (let i = 0, len = motions.length; i < len; i += 1) {
      const { line, pen } = motions[i];
      let action = control.get();
      if (action === PLOTTER_ACTION_PAUSE) {
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
        context.rate = 0;
      }

      const penRate =
        targetPen === MOTION_PEN_DOWN
          ? penDownMoveSpeed.get()
          : penUpMoveSpeed.get();
      const targetAA = xyDist2aaSteps({ x: targetLine[2], y: targetLine[3] });
      const deltaA1 = targetAA.a1 - context.a1;
      const deltaA2 = targetAA.a2 - context.a2;
      const deltaAA = Math.sqrt(deltaA1 ** 2 + deltaA2 ** 2);
      let t = 0;
      let remainingA1 = 0;
      let remainingA2 = 0;
      if (speedMode === PLOTTER_SPEED_MODE_CONSTANT) {
        const absDeltaA1 = Math.abs(deltaA1);
        const absDeltaA2 = Math.abs(deltaA2);
        const mt1 = absDeltaA1 * 1310;
        const mt2 = absDeltaA2 * 1310;

        t = Math.ceil((deltaAA / penRate) * 1000);
        if (t > mt1 && t > mt2) {
          t = Math.max(mt1, mt2);
        }

        if (t > mt1 && absDeltaA1 > 0) {
          logger.warn(`Vertical edge occurs: SM,${t},${deltaA1},${deltaA2}`);
          for (const { longStep, shortStep, time, remaining } of slopeSegments({
            t,
            stepLong: deltaA2,
            stepShort: deltaA1,
          })) {
            await device.executeCommand(commands.sm, time, shortStep, longStep);
            remainingA2 = remaining;
          }
        } else if (t > mt2 && absDeltaA2 > 0) {
          logger.warn(`Horizontal edge occurs: SM,${t},${deltaA1},${deltaA2}`);
          for (const { longStep, shortStep, time, remaining } of slopeSegments({
            t,
            stepLong: deltaA1,
            stepShort: deltaA2,
          })) {
            await device.executeCommand(commands.sm, time, longStep, shortStep);
            remainingA1 = remaining;
          }
        } else if (t > 0) {
          logger.debug(`step-move: ${deltaA1}, ${deltaA2} in ${t}ms`);
          await device.executeCommand(commands.sm, t, deltaA1, deltaA2);
        }
        context.rate = penRate;
      } else {
        const accelRate = penDownMoveAccel.get();
        const exitRate = estimateExitRate(
          motions,
          i,
          context.rate,
          penRate,
          accelRate,
          deltaAA,
        );
        const accMotions = accelMotion(
          deltaAA,
          context.rate,
          penRate,
          exitRate,
          accelRate,
        );
        const { LMParams, remaining } = accMotion2LMParams(
          accMotions,
          deltaA1,
          deltaA2,
        );
        for (const {
          initRate1,
          step1,
          accel1,
          initRate2,
          step2,
          accel2,
        } of LMParams) {
          // with this low-level stepper, we don't need to handle the slope segments issue in constant speed mode
          await device.executeCommand(
            commands.lm,
            initRate1,
            step1,
            accel1,
            initRate2,
            step2,
            accel2,
            3, // clear both accumulators
          );
        }
        remainingA1 = remaining.a1;
        remainingA2 = remaining.a2;
        t = accMotions[accMotions.length - 1].t * 1000;
        context.rate = exitRate;
      }
      context.x = targetLine[2];
      context.y = targetLine[3];
      context.a1 = targetAA.a1 - remainingA1;
      context.a2 = targetAA.a2 - remainingA2;

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
