import { bars, createSong } from '../utils';

// Pachelbel, Canon in D: the ground bass alone, then the violin's first
// variations over it
const ground = [
  ['qD4', 'qA3', 'qB3', 'qF#3'],
  ['qG3', 'qD3', 'qG3', 'qA3'],
];

export default createSong(
  'Canon in D (Pachelbel)',
  bars([
    ['w0'],
    ['w0'],
    ['qF#5', 'qE5', 'qD5', 'qC#5'],
    ['qB4', 'qA4', 'qB4', 'qC#5'],
    ['qD5', 'qC#5', 'qB4', 'qA4'],
    ['qG4', 'qF#4', 'qG4', 'qE4'],
    ['eD5', 'eF#5', 'eA5', 'eG5', 'eF#5', 'eD5', 'eF#5', 'eE5'],
    ['eD5', 'eB4', 'eD5', 'eA5', 'eG5', 'eB5', 'eA5', 'eG5'],
    ['qF#5', 'qE5', 'qD5', 'qC#5'],
    ['qB4', 'qA4', 'qB4', 'qC#5'],
    ['wD5'],
  ]),
  bars([...ground, ...ground, ...ground, ...ground, ...ground, ['wD3']]),
  60,
);
