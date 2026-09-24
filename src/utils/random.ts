/**
 * A small seeded random number generator (mulberry32): the same seed always
 * gives the same numbers, from 0 up to but not including 1.
 */
export const createRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// seeds short enough to remember and type back in
export const randomSeed = () => 1 + Math.floor(Math.random() * 9999);
