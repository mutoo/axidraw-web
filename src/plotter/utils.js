import Logger from 'js-logger';

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
  if (v0 > vt) {
    // deceleration
    const deceleratingTime = (v0 - vt) / accel;
    const requiredStepsToDecelerating = ((v0 + vt) * deceleratingTime) / 2;
    const remainingSteps = s - requiredStepsToDecelerating;
    if (remainingSteps < 0) {
      // TODO: handle this smarter
      logger.warn("Don't have enough room to decelerating");
      return null;
    }
    const decelerationMotion = {
      s: requiredStepsToDecelerating,
      t: deceleratingTime,
      v0,
      vt,
    };
    if (remainingSteps === 0) {
      // the deceleration just cover all the steps
      return [decelerationMotion];
    }
    return [
      // there are some room allow to speed up and reduce time
      ...accelMotion(remainingSteps, v0, vm, v0, accel),
      decelerationMotion,
    ];
  }

  if (v0 < vt) {
    // acceleration
    const acceleratingTime = (vt - v0) / accel;
    const requiredStepsToAccelerating = ((v0 + vt) * acceleratingTime) / 2;
    const remainingSteps = s - requiredStepsToAccelerating;
    if (remainingSteps < 0) {
      // TODO: handle this smarter
      logger.warn("Don't have enough room to decelerating");
      return null;
    }
    const accelerationMotion = {
      s: requiredStepsToAccelerating,
      t: acceleratingTime,
      v0,
      vt,
    };
    if (remainingSteps === 0) {
      // the deceleration just cover all the steps
      return [accelerationMotion];
    }
    return [
      accelerationMotion,
      // there are some room allow to speed up and reduce time
      ...accelMotion(remainingSteps, vt, vm, vt, accel),
    ];
  }

  // v0 === vt
  // try acceleration to max
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
    return [accelerationMotion, constMotion, decelerationMotion];
  }
  // if (requiredStepsToAccelerating > s / 2) {
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
