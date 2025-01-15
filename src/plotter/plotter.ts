import { IComputedValue } from 'mobx';
import { IDeviceConnector } from '@/communication/device/device';
import * as commands from '@/communication/ebb';
import { aa2xy, servoTime, xyDist2aaSteps } from '@/math/ebb';
import { distSq, Line2D } from '@/math/geom';
import { delay } from '@/utils/time';
import {
  MOTION_PEN_DOWN,
  MOTION_PEN_UP,
  PLOTTER_ACTION,
  PLOTTER_SPEED_MODE,
  PLOTTER_STATUS_PAUSED,
  PLOTTER_STATUS_STANDBY,
} from './consts';
import {
  accelMotion,
  accMotion2LMParams,
  estimateExitRate,
  mergeAccMotions,
} from './motion/const-acceleration';
import { slopeSegments } from './motion/const-velocity';
import { logger } from './utils';

export const initialContext = {
  a1: 0,
  a2: 0,
  rate: 0,
  pen: MOTION_PEN_UP,
};

export type PlotterFlow = AsyncGenerator<string, string, PLOTTER_ACTION | null>;

async function* plot({
  device,
  speedMode,
  servoMin,
  servoMax,
  servoRate,
  penUpMoveSpeed,
  penDownMoveSpeed,
  penDownMoveAccel,
  cornering,
  controlSignal,
  motions,
}: {
  device: IDeviceConnector<unknown>;
  speedMode: PLOTTER_SPEED_MODE;
  servoMin: IComputedValue<number>;
  servoMax: IComputedValue<number>;
  servoRate: IComputedValue<number>;
  penUpMoveSpeed: IComputedValue<number>;
  penDownMoveSpeed: IComputedValue<number>;
  penDownMoveAccel: IComputedValue<number>;
  cornering: IComputedValue<number>;
  controlSignal: IComputedValue<PLOTTER_ACTION | null>;
  motions: { line: Line2D; pen: number }[];
}): PlotterFlow {
  // this async generator would keep working-in-progress status
  // allow user to pause/resume to work.
  let context = { ...initialContext };
  const servo = {
    min: servoMin.get(),
    max: servoMax.get(),
    rate: servoRate.get(),
  };

  const reset = async (resetRC = true) => {
    context = { ...initialContext };
    await device.executeCommand(commands.r);
    if (resetRC) {
      await device.executeCommand(commands.sc, 4, servoMin.get());
      await device.executeCommand(commands.sc, 5, servoMax.get());
      await device.executeCommand(commands.sc, 10, servoRate.get());
    }
    await device.executeCommand(
      commands.sp,
      1,
      servoTime(servo.min, servo.max, servo.rate),
    );
    await device.executeCommand(commands.sr, 60e3);
  };
  await reset(true);
  let bufferTime = 0;
  try {
    for (let i = 0, len = motions.length; i < len; i += 1) {
      // adjust servo config when changed
      if (servo.min !== servoMin.get()) {
        await device.executeCommand(commands.sc, 4, servoMin.get());
        servo.min = servoMin.get();
        logger.debug(`update servo min: ${servo.min}`);
      }
      if (servo.max !== servoMax.get()) {
        await device.executeCommand(commands.sc, 5, servoMax.get());
        servo.max = servoMax.get();
        logger.debug(`update servo max: ${servo.max}`);
      }
      if (servo.rate !== servoRate.get()) {
        await device.executeCommand(commands.sc, 10, servoRate.get());
        servo.rate = servoRate.get();
        logger.debug(`update servo rate: ${servo.rate}`);
      }
      const { line, pen } = motions[i];
      let action = controlSignal.get();
      const shouldPause = await device.executeCommand(commands.qb);
      if (shouldPause || action === PLOTTER_ACTION.PAUSE) {
        logger.debug(`action: pause`);
        await device.executeCommand(
          commands.sp,
          1,
          servoTime(servo.min, servo.max, servo.rate),
        );
        context.pen = MOTION_PEN_UP;
        action = yield PLOTTER_STATUS_PAUSED;
      }
      const shouldStop = action === PLOTTER_ACTION.STOP;
      if (shouldStop) {
        logger.debug(`action: stop`);
      }
      const targetPen = shouldStop ? MOTION_PEN_UP : pen;
      const { x: currentX, y: currentY } = aa2xy(context);
      const targetLine: Line2D = shouldStop
        ? [
            [currentX, currentY],
            [0, 0],
          ]
        : line;

      if (distSq(targetLine[0], targetLine[1]) === 0) {
        // ignore the motion with zero length

        continue;
      }

      if (context.pen !== targetPen) {
        logger.debug(`pen ${targetPen === MOTION_PEN_UP ? 'up' : 'down'}`);
        await device.executeCommand(
          commands.sp,
          targetPen,
          servoTime(servo.min, servo.max, servo.rate),
        );
        context.pen = targetPen;
        context.rate = 0;
      }

      const penRate =
        targetPen === MOTION_PEN_DOWN
          ? penDownMoveSpeed.get()
          : penUpMoveSpeed.get();
      const targetAA = xyDist2aaSteps({
        x: targetLine[1][0],
        y: targetLine[1][1],
      });
      const deltaA1 = targetAA.a1 - context.a1;
      const deltaA2 = targetAA.a2 - context.a2;
      const deltaAA = Math.sqrt(deltaA1 ** 2 + deltaA2 ** 2);
      let t = 0;
      let remainingA1 = 0;
      let remainingA2 = 0;
      if (speedMode === PLOTTER_SPEED_MODE.CONSTANT) {
        const absDeltaA1 = Math.abs(deltaA1);
        const absDeltaA2 = Math.abs(deltaA2);
        const mt1 = (absDeltaA1 / 1.31) * 1000; // minimum speed: 1.31 steps/second
        const mt2 = (absDeltaA2 / 1.31) * 1000;

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
          { cornering: cornering.get() },
        );
        const accMotions = accelMotion(
          deltaAA,
          context.rate,
          penRate,
          exitRate,
          accelRate,
        );
        const { LMParams, remaining, endRate } = accMotion2LMParams(
          mergeAccMotions(accMotions),
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
        t = accMotions.reduce((s, m) => s + m.t, 0) * 1000;
        context.rate = endRate;
      }
      if (remainingA1 || remainingA2) {
        logger.debug(`remaining: ${remainingA1}, ${remainingA2}`);
      }
      context.a1 = targetAA.a1 - remainingA1;
      context.a2 = targetAA.a2 - remainingA2;

      bufferTime = t;

      if (shouldStop) {
        logger.debug(`stop plotting`);
        break;
      }
    }

    if (context.a1 || context.a2) {
      // reset the final error
      const blockDist = Math.abs(context.a1) + Math.abs(context.a2);
      const t = Math.ceil((blockDist / penUpMoveSpeed.get()) * 1000);
      bufferTime += t;
      await device.executeCommand(commands.sm, t, -context.a1, -context.a2);
    }

    bufferTime += 1e3;
    logger.debug(`pen is homing: ${bufferTime}`);
    await delay(bufferTime);
  } catch (e) {
    logger.error(e);
  } finally {
    await reset(false);
    logger.debug(`finished plotting`);
  }
  return PLOTTER_STATUS_STANDBY;
}

export default plot;
