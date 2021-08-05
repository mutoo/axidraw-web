// eslint-disable-next-line import/prefer-default-export
export function* slopeSegments({ t, stepLong, stepShort }) {
  const absStepShort = Math.abs(stepShort);
  const maxTimeShort = absStepShort * 1310;
  const stepShortDir = Math.sign(stepShort);
  const flatT = Math.floor((t - maxTimeShort) / (absStepShort + 1));
  const stepRateLong = stepLong / t;
  const flatStepLong = Math.floor(stepRateLong * flatT);
  const slopeStopLong = Math.floor(stepRateLong * 1310);
  let remainingStepLong = stepLong;
  /**
   *  |         ____
   *  |    ___/
   *  |___/_________
   */
  for (let i = 0, segments = 2 * absStepShort + 1; i < segments; i += 1) {
    if (i % 2 === 0) {
      // flat segment
      if (flatT > 0) {
        remainingStepLong -= flatStepLong;
        yield {
          time: flatT,
          longStep: flatStepLong,
          shortStep: 0,
          remaining: remainingStepLong,
        };
      }
    } else {
      // slope segment
      remainingStepLong -= slopeStopLong;
      yield {
        time: 1310,
        longStep: slopeStopLong,
        shortStep: stepShortDir,
        remaining: remainingStepLong,
      };
    }
  }
  // there might be remain step due to Math.floor
}
