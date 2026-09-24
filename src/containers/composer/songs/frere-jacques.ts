import { bars, createSong } from '../utils';

// A round for two voices: the second comes in two bars after the first, an
// octave lower, and each sings the tune twice
const high = [
  ['qC5', 'qD5', 'qE5', 'qC5'],
  ['qC5', 'qD5', 'qE5', 'qC5'],
  ['qE5', 'qF5', 'hG5'],
  ['qE5', 'qF5', 'hG5'],
  ['eG5', 'eA5', 'eG5', 'eF5', 'qE5', 'qC5'],
  ['eG5', 'eA5', 'eG5', 'eF5', 'qE5', 'qC5'],
  ['qC5', 'qG4', 'hC5'],
  ['qC5', 'qG4', 'hC5'],
];

const low = [
  ['qC4', 'qD4', 'qE4', 'qC4'],
  ['qC4', 'qD4', 'qE4', 'qC4'],
  ['qE4', 'qF4', 'hG4'],
  ['qE4', 'qF4', 'hG4'],
  ['eG4', 'eA4', 'eG4', 'eF4', 'qE4', 'qC4'],
  ['eG4', 'eA4', 'eG4', 'eF4', 'qE4', 'qC4'],
  ['qC4', 'qG3', 'hC4'],
  ['qC4', 'qG3', 'hC4'],
];

export default createSong(
  'Frère Jacques (round)',
  bars([...high, ...high, ['w0'], ['w0']]),
  bars([['w0'], ['w0'], ...low, ...low]),
  120,
);
