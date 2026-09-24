import { bars, createSong } from '../utils';

// Beethoven, Bagatelle No. 25 in A minor: the theme twice, the right hand in
// channel 1 and the left hand's broken chords in channel 2
const theme = [
  ['sE5', 'sEb5', 'sE5', 'sB4', 'sD5', 'sC5'],
  ['eA4', 's0', 'sC4', 'sE4', 'sA4'],
  ['eB4', 's0', 'sE4', 'sG#4', 'sB4'],
  ['eC5', 's0', 'sE4', 'sE5', 'sEb5'],
  ['sE5', 'sEb5', 'sE5', 'sB4', 'sD5', 'sC5'],
  ['eA4', 's0', 'sC4', 'sE4', 'sA4'],
  ['eB4', 's0', 'sE4', 'sC5', 'sB4'],
];

const chords = [
  ['qe0'],
  ['sA2', 'sE3', 'sA3', 'es0'],
  ['sE2', 'sE3', 'sG#3', 'es0'],
  ['sA2', 'sE3', 'sA3', 'es0'],
  ['qe0'],
  ['sA2', 'sE3', 'sA3', 'es0'],
  ['sE2', 'sE3', 'sG#3', 'es0'],
];

export default createSong(
  'Für Elise (Beethoven)',
  bars([
    ['sE5', 'sEb5'],
    ...theme,
    // first ending, back to the start
    ['eA4', 'e0', 'sE5', 'sEb5'],
    ...theme,
    ['qeA4'],
  ]),
  bars([
    ['e0'],
    ...chords,
    ['sA2', 'sE3', 'sA3', 'es0'],
    ...chords,
    ['sA2', 'sE3', 'qA3'],
  ]),
  80,
);
