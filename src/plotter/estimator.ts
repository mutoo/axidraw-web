import { IComputedValue } from 'mobx';
import { servoTime, xyDist2aaSteps } from '@/math/ebb';
import { distSq, Line2D } from '@/math/geom';
import {
  MOTION_PEN_DOWN,
  MOTION_PEN_UP,
  PLOTTER_SPEED_MODE,
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

function estimate({
  speedMode,
  servoMin,
  servoMax,
  servoRate,
  penUpMoveSpeed,
  penDownMoveSpeed,
  penDownMoveAccel,
  cornering,
  motions,
}: {
  speedMode: PLOTTER_SPEED_MODE;
  servoMin: IComputedValue<number>;
  servoMax: IComputedValue<number>;
  servoRate: IComputedValue<number>;
  penUpMoveSpeed: IComputedValue<number>;
  penDownMoveSpeed: IComputedValue<number>;
  penDownMoveAccel: IComputedValue<number>;
  cornering: IComputedValue<number>;
  motions: { line: Line2D; pen: number }[];
}) {
  // this async generator would keep working-in-progress status
  // allow user to pause/resume to work.
  const context = { ...initialContext };
  const servo = {
    min: servoMin.get(),
    max: servoMax.get(),
    rate: servoRate.get(),
  };
  let runningTime = 0;
  try {
    for (let i = 0, len = motions.length; i < len; i += 1) {
      const { line, pen } = motions[i];
      const targetPen = pen;
      const targetLine = line;

      if (distSq(targetLine[0], targetLine[1]) === 0) {
        // ignore the motion with zero length

        continue;
      }

      if (context.pen !== targetPen) {
        runningTime += servoTime(servo.min, servo.max, servo.rate);
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
        const mt1 = absDeltaA1 * 1310;
        const mt2 = absDeltaA2 * 1310;

        t = Math.ceil((deltaAA / penRate) * 1000);
        if (t > mt1 && t > mt2) {
          t = Math.max(mt1, mt2);
        }

        if (t > mt1 && absDeltaA1 > 0) {
          for (const { time, remaining } of slopeSegments({
            t,
            stepLong: deltaA2,
            stepShort: deltaA1,
          })) {
            runningTime += time;
            remainingA2 = remaining;
          }
        } else if (t > mt2 && absDeltaA2 > 0) {
          for (const { time, remaining } of slopeSegments({
            t,
            stepLong: deltaA1,
            stepShort: deltaA2,
          })) {
            runningTime += time;
            remainingA1 = remaining;
          }
        } else if (t > 0) {
          runningTime += t;
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
        for (const { time } of LMParams) {
          // with this low-level stepper, we don't need to handle the slope segments issue in constant speed mode
          runningTime += time;
        }
        remainingA1 = remaining.a1;
        remainingA2 = remaining.a2;
        t = accMotions.reduce((s, m) => s + m.t, 0) * 1000;
        context.rate = endRate;
      }
      context.a1 = targetAA.a1 - remainingA1;
      context.a2 = targetAA.a2 - remainingA2;
    }
  } catch (e) {
    logger.error(e);
  }
  return runningTime;
}

export default estimate;
