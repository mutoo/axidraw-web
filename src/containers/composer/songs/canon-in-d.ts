import { bars, createSong } from '../utils';

// Pachelbel, Canon in D, complete: violin I over the cello's ground bass, an
// octave up. From the Mutopia Project edition by Michael Fischer v. Mollard,
// CC BY 4.0 (https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2047).
const ground = [
  ['qD4', 'qA3', 'qB3', 'qF#3'],
  ['qG3', 'qD3', 'qG3', 'qA3'],
];

// bars 3 to 52, which violins II and III play two and four bars later
// prettier-ignore
const theme = [
  ['qF#5', 'qE5', 'qD5', 'qC#5'],
  ['qB4', 'qA4', 'qB4', 'qC#5'],
  ['qD5', 'qC#5', 'qB4', 'qA4'],
  ['qG4', 'qF#4', 'qG4', 'qE4'],
  ['eD4', 'eF#4', 'eA4', 'eG4', 'eF#4', 'eD4', 'eF#4', 'eE4'],
  ['eD4', 'eB3', 'eD4', 'eA4', 'eG4', 'eB4', 'eA4', 'eG4'],
  ['eF#4', 'eD4', 'eE4', 'eC#5', 'eD5', 'eF#5', 'eA5', 'eA4'],
  ['eB4', 'eG4', 'eA4', 'eF#4', 'eD4', 'eD5', 'esD5', 'sC#5'],
  [
    'sD5', 'sC#5', 'sD5', 'sD4', 'sC#4', 'sA4', 'sE4', 'sF#4',
    'sD4', 'sD5', 'sC#5', 'sB4', 'sC#5', 'sF#5', 'sA5', 'sB5',
  ],
  [
    'sG5', 'sF#5', 'sE5', 'sG5', 'sF#5', 'sE5', 'sD5', 'sC#5',
    'sB4', 'sA4', 'sG4', 'sF#4', 'sE4', 'sG4', 'sF#4', 'sE4',
  ],
  [
    'sD4', 'sE4', 'sF#4', 'sG4', 'sA4', 'sE4', 'sA4', 'sG4',
    'sF#4', 'sB4', 'sA4', 'sG4', 'sA4', 'sG4', 'sF#4', 'sE4',
  ],
  [
    'sD4', 'sB3', 'sB4', 'sC#5', 'sD5', 'sC#5', 'sB4', 'sA4',
    'sG4', 'sF#4', 'sE4', 'sB4', 'sA4', 'sB4', 'sA4', 'sG4',
  ],
  ['eF#4', 'eF#5', 'qE5', 'e0', 'eD5', 'qF#5'],
  ['qB5', 'qA5', 'qB5', 'qC#6'],
  ['eD6', 'eD5', 'qC#5', 'e0', 'eB4', 'qD5'],
  ['qeD5', 'eD5', 'eD5', 'eG5', 'eE5', 'eA5'],
  [
    'sA5', 'tF#5', 'tG5', 'sA5', 'tF#5', 'tG5',
    'tA5', 'tA4', 'tB4', 'tC#5', 'tD5', 'tE5', 'tF#5', 'tG5',
    'sF#5', 'tD5', 'tE5', 'sF#5', 'tF#4', 'tG4',
    'tA4', 'tB4', 'tA4', 'tG4', 'tA4', 'tF#4', 'tG4', 'tA4',
  ],
  [
    'sG4', 'tB4', 'tA4', 'sG4', 'tF#4', 'tE4',
    'tF#4', 'tE4', 'tD4', 'tE4', 'tF#4', 'tG4', 'tA4', 'tB4',
    'sG4', 'tB4', 'tA4', 'sB4', 'tC#5', 'tD5',
    'tA4', 'tB4', 'tC#5', 'tD5', 'tE5', 'tF#5', 'tG5', 'tA5',
  ],
  [
    'sF#5', 'tD5', 'tE5', 'sF#5', 'tE5', 'tD5',
    'tE5', 'tC#5', 'tD5', 'tE5', 'tF#5', 'tE5', 'tD5', 'tC#5',
    'sD5', 'tB4', 'tC#5', 'sD5', 'tD4', 'tE4',
    'tF#4', 'tG4', 'tF#4', 'tE4', 'tF#4', 'tD5', 'tC#5', 'tD5',
  ],
  [
    'sB4', 'tD5', 'tC#5', 'sB4', 'tA4', 'tG4',
    'tA4', 'tG4', 'tF#4', 'tG4', 'tA4', 'tB4', 'tC#5', 'tD5',
    'sB4', 'tD5', 'tC#5', 'sD5', 'tC#5', 'tB4',
    'tC#5', 'tD5', 'tE5', 'tD5', 'tC#5', 'tD5', 'tB4', 'tC#5',
  ],
  ['eD5', 'e0', 'eC#5', 'e0', 'eB4', 'e0', 'eD5', 'e0'],
  ['eD4', 'e0', 'eD4', 'e0', 'eD4', 'e0', 'eE4', 'e0'],
  ['e0', 'eA4', 'e0', 'eA4', 'e0', 'eF#4', 'e0', 'eA4'],
  ['e0', 'eG4', 'e0', 'eF#4', 'e0', 'eG4', 'e0', 'eE5'],
  [
    'sF#5', 'sF#4', 'sG4', 'sF#4', 'sE4', 'sE5', 'sF#5', 'sE5',
    'sD5', 'sF#4', 'sD4', 'sB4', 'sA4', 'sA3', 'sG3', 'sA3',
  ],
  [
    'sB3', 'sB4', 'sC#5', 'sB4', 'sA4', 'sA3', 'sG3', 'sA3',
    'sB3', 'sB4', 'sA4', 'sB4', 'sC#5', 'sC#4', 'sB3', 'sC#4',
  ],
  [
    'sD4', 'sD5', 'sE5', 'sD5', 'sC#5', 'sC#4', 'sD4', 'sC#4',
    'sB3', 'sB4', 'sA4', 'sB4', 'sC#5', 'sC#4', 'sF#4', 'sE4',
  ],
  [
    'sD4', 'sD5', 'sE5', 'sG5', 'sF#5', 'sF#4', 'sA4', 'sF#5',
    'sD5', 'sG5', 'sF#5', 'sG5', 'sE5', 'sA4', 'sG4', 'sA4',
  ],
  [
    'sF#4', 'sA4', 'sA4', 'sA4', 'sA4', 'sA4', 'sA4', 'sA4',
    'sF#4', 'sF#4', 'sF#4', 'sF#4', 'sF#4', 'sF#4', 'sA4', 'sA4',
  ],
  [
    'sG4', 'sG4', 'sG4', 'sD5', 'sD5', 'sD5', 'sD5', 'sD5',
    'sD5', 'sD5', 'sB4', 'sB4', 'sA4', 'sA4', 'sE5', 'sC#5',
  ],
  [
    'sA4', 'sF#5', 'sF#5', 'sF#5', 'sE5', 'sE5', 'sE5', 'sE5',
    'sD5', 'sD5', 'sD5', 'sD5', 'sA5', 'sA5', 'sA5', 'sA5',
  ],
  [
    'sB5', 'sB5', 'sB5', 'sB5', 'sA5', 'sA5', 'sA5', 'sA5',
    'sB5', 'sB5', 'sB5', 'sB5', 'sC#6', 'sC#5', 'sC#5', 'sC#5',
  ],
  [
    'sD5', 'tD4', 'tE4', 'sF#4', 'sD4', 'sC#4', 'tC#5', 'tD5', 'sE5', 'sC#5',
    'sB4', 'tB3', 'tC#4', 'sD4', 'sB3', 'sC#4', 'tA4', 'tG4', 'sF#4', 'sE4',
  ],
  [
    'sD4', 'tG4', 'tF#4', 'sE4', 'sG4', 'sF#4', 'tD4', 'tE4', 'sF#4', 'sA4',
    'sG4', 'tB4', 'tA4', 'sG4', 'sF#4', 'sE4', 'tA4', 'tG4', 'sF#4', 'sE4',
  ],
  [
    'sF#4', 'tD5', 'tC#5', 'sD5', 'sF#4', 'sA4', 'tA4', 'tB4', 'sC#5', 'sA4',
    'sF#4', 'tD5', 'tE5', 'sF#5', 'sD5', 'sF#5', 'tF#5', 'tE5', 'sD5', 'sC#5',
  ],
  [
    'sB4', 'tB4', 'tA4', 'sB4', 'sC#5', 'sD5', 'tF#5', 'tE5', 'sD5', 'sF#5',
    'sG5', 'tD5', 'tC#5', 'sB4', 'sB4', 'sA4', 'sE4', 'sA4', 'sA4',
  ],
  ['qeA4', 'eA4', 'qeD4', 'eA4'],
  ['qG4', 'qA4', 'eG4', 'eD4', 'esD4', 'sC#4'],
  ['eD4', 'eD5', 'qC#5', 'qB4', 'qA4'],
  ['esD4', 'sE4', 'qF#4', 'qB4', 'esE4', 'sE4'],
  [
    'esF#4', 'sF#5', 'sF#5', 'sG5', 'sF#5', 'sE5',
    'esD5', 'sD5', 'sD5', 'sE5', 'sD5', 'sC#5',
  ],
  ['qB4', 'qD5', 'sD5', 'sC5', 'sB4', 'sC5', 'esA4', 'sA4'],
  [
    'esA4', 'sA5', 'sA5', 'sB5', 'sA5', 'sG5',
    'esF#5', 'sF#5', 'sF#5', 'sG5', 'sF#5', 'sE5',
  ],
  ['sD5', 'sC5', 'sB4', 'sC5', 'esA4', 'sA4', 'eG4', 'eD5', 'esC#5', 'sC#5'],
  ['eD5', 'qD5', 'qC#5', 'qB4', 'eA4'],
  // the A is tied over the bar line, so it is struck again
  ['eA4', 'qG4', 'qsF#4', 'sE4', 'qE4'],
  ['eF#4', 'qF#5', 'eE5', 'eD5', 'qD6', 'eC6'],
  ['qB5', 'eD6', 'eA5', 'qB5', 'qA5'],
  ['qA5', 'esA4', 'sG4', 'qF#4', 'esF#5', 'sE5'],
  ['qeD5', 'eD5', 'qD5', 'qC#5'],
];

// violin I's own last bars
// prettier-ignore
const coda = [
  ['eD5', 'eD4', 'eC#4', 'eC#5', 'eB4', 'eB3', 'eA3', 'eA4'],
  ['eG4', 'eG5', 'eF#5', 'eF#4', 'eE4', 'eB4', 'eE4', 'eE5'],
  ['eF#5', 'eF#4', 'eE4', 'eE5', 'eD5', 'eD4', 'eC#4', 'eC#5'],
  ['eB4', 'eB5', 'eA5', 'eA4', 'esG4', 'sE5', 'eA4', 'eA4'],
  ['qA4', 'q0', 'h0'],
];

export default createSong(
  'Canon in D (Pachelbel)',
  bars([['w0'], ['w0'], ...theme, ...coda]),
  bars([
    ...Array.from({ length: 28 }, () => ground).flat(),
    ['qD4', 'q0', 'h0'],
  ]),
  60,
);
