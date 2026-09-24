import { bars, createSong } from '../utils';

// Russian folk song, best known as the Tetris theme: the tune twice over a
// root-and-fifth bass
const tune = [
  ['qE5', 'eB4', 'eC5', 'qD5', 'eC5', 'eB4'],
  ['qA4', 'eA4', 'eC5', 'qE5', 'eD5', 'eC5'],
  ['qeB4', 'eC5', 'qD5', 'qE5'],
  ['qC5', 'qA4', 'qA4', 'q0'],
  ['e0', 'qD5', 'eF5', 'qA5', 'eG5', 'eF5'],
  ['qeE5', 'eC5', 'qE5', 'eD5', 'eC5'],
  ['qB4', 'eB4', 'eC5', 'qD5', 'qE5'],
];

const bass = [
  ['qE3', 'qB3', 'qE3', 'qB3'],
  ['qA2', 'qE3', 'qA2', 'qE3'],
  ['qE3', 'qB3', 'qE3', 'qB3'],
  ['qA2', 'qE3', 'hA2'],
  ['qD3', 'qA3', 'qD3', 'qA3'],
  ['qC3', 'qG3', 'qC3', 'qG3'],
  ['qE3', 'qB3', 'qE3', 'qB3'],
];

export default createSong(
  'Korobeiniki (Tetris theme)',
  bars([...tune, ['qC5', 'qA4', 'qA4', 'q0'], ...tune, ['qC5', 'qA4', 'hA4']]),
  bars([...bass, ['qA2', 'qE3', 'hA2'], ...bass, ['qA2', 'qE3', 'hA2']]),
  144,
);
