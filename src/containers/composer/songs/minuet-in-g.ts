import { bars, createSong } from '../utils';

// Petzold, Minuet in G from the Anna Magdalena Bach notebook: the right hand
// in channel 1, a bass line in channel 2
export default createSong(
  'Minuet in G (Petzold)',
  bars([
    ['qD5', 'eG4', 'eA4', 'eB4', 'eC5'],
    ['qD5', 'qG4', 'qG4'],
    ['qE5', 'eC5', 'eD5', 'eE5', 'eF#5'],
    ['qG5', 'qG4', 'qG4'],
    ['qC5', 'eD5', 'eC5', 'eB4', 'eA4'],
    ['qB4', 'eC5', 'eB4', 'eA4', 'eG4'],
    ['qF#4', 'eG4', 'eA4', 'eB4', 'eG4'],
    ['hqA4'],
    ['qD5', 'eG4', 'eA4', 'eB4', 'eC5'],
    ['qD5', 'qG4', 'qG4'],
    ['qE5', 'eC5', 'eD5', 'eE5', 'eF#5'],
    ['qG5', 'qG4', 'qG4'],
    ['qC5', 'eD5', 'eC5', 'eB4', 'eA4'],
    ['qB4', 'eC5', 'eB4', 'eA4', 'eG4'],
    ['qA4', 'eB4', 'eA4', 'eG4', 'eF#4'],
    ['hqG4'],
  ]),
  bars([
    ['hG3', 'qA3'],
    ['hqB3'],
    ['hqC4'],
    ['hqB3'],
    ['hqA3'],
    ['hqG3'],
    ['qD4', 'qB3', 'qG3'],
    ['qD4', 'eC4', 'eB3', 'eA3', 'eF#3'],
    ['hG3', 'qA3'],
    ['hqB3'],
    ['hqC4'],
    ['hqB3'],
    ['hqA3'],
    ['hqG3'],
    ['hD4', 'qD3'],
    ['hqG3'],
  ]),
  112,
);
