import { mm2steps, s2rate, xyDist2aaSteps } from 'math/ebb';
import { MOTION_PEN_UP } from '../consts';
import { logger } from '../utils';

// a very inspiring algorithm from Sonny Jeon
// https://onehossshay.wordpress.com/2011/09/24/improving_grbl_cornering_algorithm/
export const computeJunctionRate = ([x0, y0], [x1, y1], accel, opt) => {
  const cos =
    (x0 * x1 + y0 * y1) /
    (Math.sqrt(x0 * x0 + y0 * y0) * Math.sqrt(x1 * x1 + y1 * y1));
  const sinHalf = Math.sqrt((1 - cos) / 2);
  const R = (mm2steps(opt.cornering) * sinHalf) / (1 - sinHalf);
  return Math.sqrt(accel * R);
};

export const estimateExitRate = (
  motions,
  fromIdx,
  vEnter,
  maxPenRate,
  accel,
  deltaAA,
  options = {},
) => {
  const opt = {
    cornering: 0.1,
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
  const maxExitRate = Math.sqrt(accel * deltaAA * 2 + vEnter);
  return Math.min(maxExitRate, context.exitRate) | 0;
};

export const accelMotion = (s, v0, vm, vt, accel) => {
  if (v0 !== vt) {
    const dir = Math.sign(vt - v0);
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
      dir,
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
    dir: 1,
  };
  const decelerationMotion = {
    s: requiredStepsToAccelerating,
    t: acceleratingTime,
    v0: vm,
    vt: v0,
    dir: -1,
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
      dir: 0,
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
  const vc = Math.sqrt(accel * s + v0 * v0);
  const t = (vc - v0) / accel;
  const cappedAccelerationMotion = {
    s: s / 2,
    t,
    v0,
    vt: vc,
    dir: 1,
  };
  const cappedDecelerationMotion = {
    s: s / 2,
    t,
    v0: vc,
    vt: v0,
    dir: -1,
  };
  return [cappedAccelerationMotion, cappedDecelerationMotion];
};

export function mergeAccMotions(accMotions) {
  if (accMotions?.length < 2) {
    return accMotions;
  }
  const mergedMotions = [];
  for (let i = 0; i < accMotions.length; i += 1) {
    const accMotion0 = accMotions[i];
    const accMotion1 = accMotions[i + 1];
    if (
      accMotion1 &&
      accMotion0.vt === accMotion1.v0 &&
      accMotion0.dir === accMotion1.dir
    ) {
      mergedMotions.push({
        s: accMotion0.s + accMotion1.s,
        t: accMotion0.t + accMotion1.t,
        v0: accMotion0.v0,
        vt: accMotion1.vt,
        dir: accMotion0.dir,
      });
      i += 1;
    } else {
      mergedMotions.push(accMotion0);
    }
  }
  return mergedMotions;
}

export const accMotion2LMParams = (accMotions, deltaA1, deltaA2) => {
  const deltaAA = Math.sqrt(deltaA1 ** 2 + deltaA2 ** 2);
  const cos = deltaA1 / deltaAA;
  const sin = deltaA2 / deltaAA;
  let remainingA1 = deltaA1;
  let remainingA2 = deltaA2;
  const LMParams = [];
  for (const accMotion of accMotions) {
    const initRate = s2rate(accMotion.v0);
    const dir = accMotion.v0 <= accMotion.vt ? 1 : -1;
    const accel =
      (s2rate(accMotion.vt) - s2rate(accMotion.v0)) / (accMotion.t * 25000);
    const initRate1 = Math.abs(initRate * cos) | 0;
    const initRate2 = Math.abs(initRate * sin) | 0;
    const step1 = (accMotion.s * cos) | 0;
    const step2 = (accMotion.s * sin) | 0;
    const accel1 = (dir * Math.abs(accel * cos)) | 0;
    const accel2 = (dir * Math.abs(accel * sin)) | 0;
    if (
      // no move
      (step1 === 0 && step2 === 0) ||
      // step1 can not move
      (step1 !== 0 && initRate1 === 0 && accel1 === 0) ||
      // step2 can not move
      (step2 !== 0 && initRate2 === 0 && accel2 === 0)
    ) {
      // eslint-disable-next-line no-continue
      continue;
    }
    logger.debug(
      `low-level-move: ${step1}, ${step2} with v0 ${initRate1}, ${initRate2} acc ${accel1}, ${accel2}`,
    );
    LMParams.push({
      initRate1,
      step1,
      accel1,
      initRate2,
      step2,
      accel2,
    });
    remainingA1 -= step1;
    remainingA2 -= step2;
  }

  return {
    LMParams,
    remaining: {
      a1: remainingA1,
      a2: remainingA2,
    },
  };
};
