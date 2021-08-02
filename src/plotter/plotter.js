/* eslint-disable no-await-in-loop */
import * as commands from 'communication/ebb';
import { MOTION_PEN_DOWN, MOTION_PEN_UP } from './planner';
import { s2rate, xyDist2aaSteps } from '../math/ebb';
import { delay } from '../utils/time';
import { accelMotion, logger, slopeSegments } from './utils';

export const PLOTTER_STATUS_STANDBY = 'axidraw-web-plotter-status-standby';
export const PLOTTER_STATUS_PAUSED = 'axidraw-web-plotter-status-paused';
export const PLOTTER_STATUS_PLOTTING = 'axidraw-web-plotter-status-plotting';

export const PLOTTER_ACTION_PAUSE = 'axidraw-web-plotter-action-pause';
export const PLOTTER_ACTION_STOP = 'axidraw-web-plotter-action-stop';

export const PLOTTER_SPEED_MODE_CONSTANT =
  'axidraw-web-plotter-speed-mode-constant';
export const PLOTTER_SPEED_MODE_ACCELERATING =
  'axidraw-web-plotter-speed-mode-accelerating';

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
      const targetMode =
        targetPen === MOTION_PEN_UP ? PLOTTER_SPEED_MODE_CONSTANT : speedMode;
      const targetLine = shouldStop ? [context.x, context.y, 0, 0] : line;
      if (context.pen !== targetPen) {
        logger.debug(`pen ${targetPen === MOTION_PEN_UP ? 'up' : 'down'}`);
        await device.executeCommand(commands.sp, targetPen, 500);
        context.pen = targetPen;
      }

      const penRate =
        targetPen === MOTION_PEN_DOWN
          ? penDownMoveSpeed.get()
          : penUpMoveSpeed.get();
      const targetAA = xyDist2aaSteps({ x: targetLine[2], y: targetLine[3] });
      const deltaA1 = targetAA.a1 - context.a1;
      const deltaA2 = targetAA.a2 - context.a2;
      const deltaAA = Math.sqrt(deltaA1 ** 2 + deltaA2 ** 2);
      const absDeltaA1 = Math.abs(deltaA1);
      const absDeltaA2 = Math.abs(deltaA2);
      let t = 0;

      if (targetMode === PLOTTER_SPEED_MODE_CONSTANT) {
        t = Math.ceil((deltaAA / penRate) * 1000);
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
        context.rate = s2rate(penRate);
      } else {
        const accMotions = accelMotion(
          deltaAA,
          0,
          penRate,
          0,
          penDownMoveAccel.get(),
        );
        for (const motion of accMotions) {
          const initRate = s2rate(motion.v0);
          const dir = motion.v0 <= motion.vt ? 1 : -1;
          const cos = deltaA1 / deltaAA;
          const initRate1 = Math.abs(initRate * cos) | 0;
          const step1 = (motion.s * cos) | 0;
          const accel = (motion.vt - motion.v0) / motion.t;
          const acc = s2rate(accel) / 25000;
          const accel1 = (dir * Math.abs(acc * cos)) | 0;
          const sin = deltaA2 / deltaAA;
          const initRate2 = Math.abs(initRate * sin) | 0;
          const step2 = (motion.s * sin) | 0;
          const accel2 = (dir * Math.abs(acc * sin)) | 0;
          // with this low-level stepper, we don't need to handle the slope segments issue in constant speed mode
          logger.debug(
            `low-level-move: ${step1}, ${step2} with v0 ${initRate1}, ${initRate2} acc ${accel1}, ${accel2}`,
          );
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
          t = motion.t * 1000;
        }
        context.rate = 0;
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
