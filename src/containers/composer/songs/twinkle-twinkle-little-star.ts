import { bars, createSong } from '../utils';

// The French tune Mozart wrote his variations on, over an Alberti bass: each
// chord broken low, high, middle, high, two to a bar
const C = ['eC4', 'eG4', 'eE4', 'eG4'];
const F = ['eC4', 'eA4', 'eF4', 'eA4'];
const G = ['eB3', 'eG4', 'eD4', 'eG4'];
const G7 = ['eB3', 'eF4', 'eD4', 'eF4'];

const verse = {
  tune: [
    ['qC5', 'qC5', 'qG5', 'qG5'],
    ['qA5', 'qA5', 'hG5'],
    ['qF5', 'qF5', 'qE5', 'qE5'],
    ['qD5', 'qD5', 'hC5'],
  ],
  bass: [
    [...C, ...C],
    [...F, ...C],
    [...F, ...C],
    [...G7, ...C],
  ],
};

const bridge = {
  tune: [
    ['qG5', 'qG5', 'qF5', 'qF5'],
    ['qE5', 'qE5', 'hD5'],
    ['qG5', 'qG5', 'qF5', 'qF5'],
    ['qE5', 'qE5', 'hD5'],
  ],
  bass: [
    [...C, ...G7],
    [...C, ...G],
    [...C, ...G7],
    [...C, ...G],
  ],
};

export default createSong(
  'Twinkle, Twinkle, Little Star',
  bars([...verse.tune, ...bridge.tune, ...verse.tune]),
  bars([
    ...verse.bass,
    ...bridge.bass,
    ...verse.bass.slice(0, -1),
    [...G7, 'hC3'],
  ]),
  96,
);
