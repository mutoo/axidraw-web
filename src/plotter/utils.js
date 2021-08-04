import Logger from 'js-logger';
import { MOTION_PEN_UP } from './consts';
import { mm2steps, xyDist2aaSteps } from '../math/ebb';

export const logger = Logger.get('plotter');

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

export const accelMotion = (s, v0, vm, vt, accel) => {
  if (v0 !== vt) {
    // try to make an acceleration(or deceleration) to catchup the speed first
    const catchupTime = Math.abs(v0 - vt) / accel;
    const requiredStepsToCatchup = ((v0 + vt) * catchupTime) / 2;
    const remainingSteps = (s - requiredStepsToCatchup) | 0;
    if (remainingSteps < 0) {
      // TODO: handle this smarter
      throw new Error("Don't have enough room to accelerating");
    }
    const catchupMotion = {
      s: requiredStepsToCatchup,
      t: catchupTime,
      v0,
      vt,
    };
    if (remainingSteps === 0) {
      // noice! the acceleration/deceleration just cover all the steps to catchup
      return [catchupMotion];
    }
    if (v0 < vt) {
      return [
        catchupMotion,
        // there are some room allow to speed up after accelerating
        ...accelMotion(remainingSteps, vt, vm, vt, accel),
      ];
    }
    return [
      // there are some room allow to speed up before decelerating
      ...accelMotion(remainingSteps, v0, vm, v0, accel),
      // it's a deceleration
      catchupMotion,
    ];
  }

  /* v0 === vt */
  // try acceleration to max rate
  const acceleratingTime = (vm - v0) / accel;
  const requiredStepsToAccelerating = ((v0 + vm) * acceleratingTime) / 2;
  const accelerationMotion = {
    s: requiredStepsToAccelerating,
    t: acceleratingTime,
    v0,
    vt: vm,
  };
  const decelerationMotion = {
    s: requiredStepsToAccelerating,
    t: acceleratingTime,
    v0: vm,
    vt: v0,
  };
  if (requiredStepsToAccelerating === s / 2) {
    return [accelerationMotion, decelerationMotion];
  }
  if (requiredStepsToAccelerating < s / 2) {
    const remainingSteps = s - requiredStepsToAccelerating * 2;
    const constTime = remainingSteps / vm;
    const constMotion = {
      s: remainingSteps,
      t: constTime,
      v0: vm,
      vt: vm,
    };
    return [
      requiredStepsToAccelerating > 0 ? accelerationMotion : null,
      constMotion,
      requiredStepsToAccelerating > 0 ? decelerationMotion : null,
    ].filter(Boolean);
  }
  /* requiredStepsToAccelerating > s / 2 */
  // don't have enough room to accelerate to max rate, cap it.
  // (v0 + v1) * t / 2 = s / 2
  // v1 = v0 + a * t
  // =>
  // v1 = v0 + sqrt(a * s + v0 ^ 2)
  // t = (v1 - v0) / a
  const vc = v0 + Math.sqrt(accel * s + v0 * v0);
  const t = (vc - v0) / accel;
  const cappedAccelerationMotion = {
    s: s / 2,
    t,
    v0,
    vt: vc,
  };
  const cappedDecelerationMotion = {
    s: s / 2,
    t,
    v0: vc,
    vt: v0,
  };
  return [cappedAccelerationMotion, cappedDecelerationMotion];
};

// a very inspiring algorithm from Sonny Jeon
// https://onehossshay.wordpress.com/2011/09/24/improving_grbl_cornering_algorithm/
export const computeJunctionRate = ([x0, y0], [x1, y1], accel, opt) => {
  const cos =
    (x0 * x1 + y0 * y1) /
    (Math.sqrt(x0 * x0 + y0 * y0) * Math.sqrt(x1 * x1 + y1 * y1));
  const sinHalf = Math.sqrt((1 - cos) / 2);
  const R = (mm2steps(opt.delta) * sinHalf) / (1 - sinHalf);
  return Math.sqrt(accel * R);
};

export const estimateExitRate = (
  motions,
  fromIdx,
  vEnter,
  maxPenRate,
  accel,
  options = {},
) => {
  const opt = {
    delta: 2,
    lookingForward: 10,
    ...options,
  };
  const currentMotion = motions[fromIdx];
  if (currentMotion.pen === MOTION_PEN_UP) return 0;
  const followingMotions = [currentMotion];
  for (let i = 1; i < opt.lookingForward; i += 1) {
    const followingMotion = motions[fromIdx + i];
    if (followingMotion.pen === MOTION_PEN_UP) {
      break;
    }
    followingMotions.push(followingMotion);
  }
  if (followingMotions.length === 1) {
    return 0;
  }
  const context = { exitRate: 0 };
  for (let i = followingMotions.length - 1; i > 0; i -= 1) {
    const motionAtTheEnd = followingMotions[i];
    const motionSecondTheEnd = followingMotions[i - 1];
    const [x0, y0] = motionSecondTheEnd.line;
    const [x1, y1, x2, y2] = motionAtTheEnd.line;
    const aa0 = xyDist2aaSteps({ x: x0 - x1, y: y0 - y1 });
    const aa1 = xyDist2aaSteps({ x: x2 - x1, y: y2 - y1 });
    const aaDist1 = Math.sqrt(aa1.a1 ** 2 + aa1.a2 ** 2);
    const maxEnterRate = Math.sqrt(accel * aaDist1 * 2 + context.exitRate);
    const junctionRate = computeJunctionRate(
      [aa0.a1, aa0.a2],
      [aa1.a1, aa1.a2],
      accel,
      opt,
    );
    context.exitRate = Math.min(junctionRate, maxEnterRate, maxPenRate);
  }
  const [x0, y0, x1, y1] = currentMotion.line;
  const aa = xyDist2aaSteps({ x: x1 - x0, y: y1 - y0 });
  const aaDist = Math.sqrt(aa.a1 ** 2 + aa.a2 ** 2);
  const maxExitRate = Math.sqrt(accel * aaDist * 2 + vEnter);
  return Math.min(maxExitRate, context.exitRate);
};
