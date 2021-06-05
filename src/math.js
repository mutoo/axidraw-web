/**
 * This function transform x,y coordination to two-axis coordination with matrix
 * | 1,  1 |
 * | 1, -1 |
 * @param x
 * @param y
 * @returns {{a1: number, a2: number}}
 */
export const xy2aa = ({x, y}) => ({
    a1: x + y,
    a2: x - y,
})

/**
 * This function transform two-axis coordination to xy coordination with reverse matrix of
 * | 1,  1 |
 * | 1, -1 |
 * reverse:
 * | 1/2,  1/2 |
 * | 1/2, -1/2 |
 * @param a1
 * @param a2
 * @returns {{x: number, y: number}}
 */
export const aa2xy = ({a1, a2}) => ({
    x: (a1 + a2) / 2,
    y: (a1 - a2) / 2,
})

// step to rate, accumulator: 2**31 rate = 1 step
export const s2rate = (hz) => (2 ** 31 / 25000 * hz) >> 0;

// rate to step, accumulator: 2**31 rate = 1 step
export const rate2s = (rate) => (rate / (2 ** 31) * 25000) >> 0;

// time to intervals: 25000 intervals per second
export const t2interval = (t) => t * 25000;

// intervals to time: 25000 intervals per second
export const interval2t = (interval) => interval / 25000;

/**
 * Calculate time to move from rate, step and acc for LM command
 * by solving s = vt + 1/2 * at^2 for t
 * @param rate added to accumulator each 40 μs, 2**31 rate = 1 step
 * @param step steps to move on axis
 * @param acc the acceleration for rate per 40 μs
 * @returns {null|number}
 */
export const rsa2t = ({rate, step, acc}) => {
    const S = step;
    const V = rate2s(rate);
    const A = rate2s(acc * 25000);
    if (A === 0) return S / V;
    const delta = 2 * A * S + V * V;
    if (delta < 0) return null;
    const t0 = (Math.sqrt(delta) - V) / A;
    if (Math.abs(delta) < 0.001) return t0;
    const t1 = -(Math.sqrt(delta) + V) / A;
    const [s1, s2] = t0 < t1 ? [t0, t1] : [t1, t0];
    return s1 < 0 ? s2 : s1;
}

/**
 * Calculator steps to move from interval, rate and acc for LT command
 * by solving s = vt + 1/2 * at^2
 * @param interval the amount of 40 μs
 * @param rate added to accumulator each 40 μs, 2**31 rate = 1 step
 * @param acc the acceleration for rate per 40 μs
 */
export const ira2s = ({interval, rate, acc}) => {
    const T = interval2t(interval);
    const V = rate2s(rate);
    const A = rate2s(acc * 25000);
    return (V * T + A * T * T / 2) >> 0;
}