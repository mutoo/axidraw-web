import { bars, createSong } from '../utils';

// The nursery song, two verses over a root-and-fifth bass
const verse = {
  tune: [
    ['qC5', 'eC5', 'eC5', 'qC5', 'qE5'],
    ['qG5', 'qE5', 'hC5'],
    ['qD5', 'qB4', 'hG4'],
    ['qG5', 'qE5', 'qC5', 'qG4'],
    ['qC5', 'eC5', 'eC5', 'qC5', 'qE5'],
    ['qG5', 'qE5', 'hC5'],
    ['hD5', 'qG4', 'qG4'],
  ],
  bass: [
    ['qC3', 'qG3', 'qC3', 'qG3'],
    ['qC3', 'qG3', 'qE3', 'qG3'],
    ['qG2', 'qD3', 'qB2', 'qD3'],
    ['qC3', 'qG3', 'qC3', 'qG2'],
    ['qC3', 'qG3', 'qC3', 'qG3'],
    ['qC3', 'qG3', 'qE3', 'qG3'],
    ['qG2', 'qD3', 'qB2', 'qD3'],
  ],
};

export default createSong(
  'The Wheels on the Bus',
  bars([['qG4'], ...verse.tune, ['hC5', 'q0', 'qG4'], ...verse.tune, ['wC5']]),
  bars([
    ['q0'],
    ...verse.bass,
    ['qC3', 'qG3', 'qC3', 'qG2'],
    ...verse.bass,
    ['qC3', 'qG2', 'hC3'],
  ]),
  120,
);
