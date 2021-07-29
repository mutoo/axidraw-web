import {
  closePath,
  coordinatePair,
  coordinatePairSequence,
  floatConst,
  horizontalLineto,
  intConst,
  lineto,
  moveto,
  nonNegNumber,
  number,
  parsePath,
  path,
  verticalLineto,
} from '../path/parser';

describe('svg-path', () => {
  describe('float point constant', () => {
    it('parse valid float point constant', () => {
      expect(floatConst('1.23')).toEqual({ value: '1.23', remain: '' });
      expect(floatConst('1.')).toEqual({ value: '1', remain: '' });
      expect(floatConst('1.23e1')).toEqual({ value: '1.23e1', remain: '' });
      expect(floatConst('1.23e-1')).toEqual({ value: '1.23e-1', remain: '' });
      expect(floatConst('1.23e+1')).toEqual({ value: '1.23e+1', remain: '' });
      expect(floatConst('1.e+1')).toEqual({ value: '1e+1', remain: '' });
      expect(floatConst('.1')).toEqual({ value: '.1', remain: '' });
      expect(floatConst('.1e+1')).toEqual({ value: '.1e+1', remain: '' });
      expect(floatConst('1e+1')).toEqual({ value: '1e+1', remain: '' });
      expect(floatConst('12e+1')).toEqual({ value: '12e+1', remain: '' });
    });
    it('throw invalid float point constant', () => {
      expect(() => floatConst('')).toThrow();
      expect(() => floatConst('M')).toThrow();
    });
  });

  describe('integer constant', () => {
    it('parse valid integer constant', () => {
      expect(intConst('1')).toEqual({ value: '1', remain: '' });
      expect(intConst('12')).toEqual({ value: '12', remain: '' });
      expect(intConst('012')).toEqual({ value: '012', remain: '' });
      expect(intConst('1.23')).toEqual({ value: '1', remain: '.23' });
      expect(intConst('12.3')).toEqual({ value: '12', remain: '.3' });
    });
    it('throw invalid integer constant', () => {
      expect(() => intConst('')).toThrow();
      expect(() => intConst('M')).toThrow();
    });
  });

  describe('non negative number', () => {
    it('parse valid non negative number', () => {
      expect(nonNegNumber('1')).toEqual({ value: 1, remain: '' });
      expect(nonNegNumber('12')).toEqual({ value: 12, remain: '' });
      expect(nonNegNumber('012')).toEqual({ value: 12, remain: '' });
      expect(nonNegNumber('1.23')).toEqual({ value: 1.23, remain: '' });
      expect(nonNegNumber('12.3')).toEqual({ value: 12.3, remain: '' });
      expect(nonNegNumber('1.23e1')).toEqual({ value: 12.3, remain: '' });
      expect(nonNegNumber('1.23e-1')).toEqual({ value: 0.123, remain: '' });
    });
    it('throw invalid non negative number', () => {
      expect(() => nonNegNumber('')).toThrow();
      expect(() => nonNegNumber('M')).toThrow();
    });
  });

  describe('number', () => {
    it('parse valid number', () => {
      expect(number('1')).toEqual({ value: 1, remain: '' });
      expect(number('12')).toEqual({ value: 12, remain: '' });
      expect(number('012')).toEqual({ value: 12, remain: '' });
      expect(number('1.23')).toEqual({ value: 1.23, remain: '' });
      expect(number('12.3')).toEqual({ value: 12.3, remain: '' });
      expect(number('1.23e1')).toEqual({ value: 12.3, remain: '' });
      expect(number('1.23e-1')).toEqual({ value: 0.123, remain: '' });
      expect(number('-1')).toEqual({ value: -1, remain: '' });
      expect(number('+12')).toEqual({ value: 12, remain: '' });
      expect(number('-012')).toEqual({ value: -12, remain: '' });
      expect(number('+1.23')).toEqual({ value: 1.23, remain: '' });
      expect(number('-12.3')).toEqual({ value: -12.3, remain: '' });
      expect(number('+1.23e1')).toEqual({ value: 12.3, remain: '' });
      expect(number('-1.23e-1')).toEqual({ value: -0.123, remain: '' });
    });
    it('throw invalid number', () => {
      expect(() => number('')).toThrow();
      expect(() => number('M')).toThrow();
    });
  });

  describe('coordinate pair', () => {
    it('parse valid coordinate pair', () => {
      expect(coordinatePair('0 1')).toEqual({ value: [0, 1], remain: '' });
      expect(coordinatePair('2,3')).toEqual({ value: [2, 3], remain: '' });
      expect(coordinatePair('0  1')).toEqual({ value: [0, 1], remain: '' });
      expect(coordinatePair('0, 1')).toEqual({ value: [0, 1], remain: '' });
      expect(coordinatePair('0 ,1')).toEqual({ value: [0, 1], remain: '' });
      expect(coordinatePair('0   1')).toEqual({ value: [0, 1], remain: '' });
      // for the string "M 0.6.5", the first coordinate of the "moveto" consumes the characters "0.6"
      // and stops upon encountering the second decimal point because the production of a "coordinate"
      // only allows one decimal point. The result is that the first coordinate will be "0.6"
      // and the second coordinate will be ".5".
      expect(coordinatePair('0.6.5')).toEqual({
        value: [0.6, 0.5],
        remain: '',
      });
      // more complicate rules
      expect(coordinatePair('+0.1e+2+3.4e+5')).toEqual({
        value: [0.1e2, 3.4e5],
        remain: '',
      });
    });
    it('throw invalid coordinate pair', () => {
      expect(() => coordinatePair('')).toThrow();
      expect(() => coordinatePair('M')).toThrow();
      expect(() => coordinatePair('0')).toThrow();
      expect(() => coordinatePair('0 ')).toThrow();
    });
  });

  describe('coordinate pair sequence', () => {
    it('parse valid coordinate pair sequence', () => {
      expect(coordinatePairSequence('0 1 2 3')).toEqual({
        value: [
          [0, 1],
          [2, 3],
        ],
        remain: '',
      });
      expect(coordinatePairSequence('0,1 2,3')).toEqual({
        value: [
          [0, 1],
          [2, 3],
        ],
        remain: '',
      });
      expect(coordinatePairSequence('0 1,2 3')).toEqual({
        value: [
          [0, 1],
          [2, 3],
        ],
        remain: '',
      });
      expect(coordinatePairSequence('0  1  2  3')).toEqual({
        value: [
          [0, 1],
          [2, 3],
        ],
        remain: '',
      });
    });
    it('throw invalid coordinate pair sequence', () => {
      expect(() => coordinatePairSequence('')).toThrow();
      expect(() => coordinatePairSequence('M')).toThrow();
    });
  });

  describe('moveto', () => {
    it('parse valid moveto', () => {
      expect(moveto('m0 1')).toEqual({ value: ['m', [0, 1]], remain: '' });
      expect(moveto('M0 1')).toEqual({ value: ['M', [0, 1]], remain: '' });
      expect(moveto('M0,1')).toEqual({ value: ['M', [0, 1]], remain: '' });
      expect(moveto('M0  1')).toEqual({ value: ['M', [0, 1]], remain: '' });
      expect(moveto('M 0 1')).toEqual({ value: ['M', [0, 1]], remain: '' });
      expect(moveto('M0,1 2,3')).toEqual({
        value: ['M', [0, 1], [2, 3]],
        remain: '',
      });
    });
    it('throw invalid moveto', () => {
      expect(() => moveto('')).toThrow();
      expect(() => moveto('M')).toThrow();
      expect(() => moveto('M1')).toThrow();
      expect(() => moveto('M1,')).toThrow();
    });
  });

  describe('lineto', () => {
    it('parse valid lineto command', () => {
      expect(lineto('l0 1')).toEqual({ value: ['l', [0, 1]], remain: '' });
      expect(lineto('L0 1')).toEqual({ value: ['L', [0, 1]], remain: '' });
      expect(lineto('L0,1')).toEqual({ value: ['L', [0, 1]], remain: '' });
      expect(lineto('L0  1')).toEqual({ value: ['L', [0, 1]], remain: '' });
      expect(lineto('L 0 1')).toEqual({ value: ['L', [0, 1]], remain: '' });
      expect(lineto('L0,1 2,3')).toEqual({
        value: ['L', [0, 1], [2, 3]],
        remain: '',
      });
    });
    it('throw invalid lineto command', () => {
      expect(() => lineto('')).toThrow();
      expect(() => lineto('L')).toThrow();
      expect(() => lineto('L1')).toThrow();
      expect(() => lineto('L1,')).toThrow();
    });
  });

  describe('horizontal lineto', () => {
    it('parse valid horizontal lineto command', () => {
      expect(horizontalLineto('h1')).toEqual({ value: ['h', 1], remain: '' });
      expect(horizontalLineto('H1')).toEqual({ value: ['H', 1], remain: '' });
      expect(horizontalLineto('H1 2')).toEqual({
        value: ['H', 1, 2],
        remain: '',
      });
      expect(horizontalLineto('H1,2')).toEqual({
        value: ['H', 1, 2],
        remain: '',
      });
      expect(horizontalLineto('H1 2 3')).toEqual({
        value: ['H', 1, 2, 3],
        remain: '',
      });
      expect(horizontalLineto('H1 2,3')).toEqual({
        value: ['H', 1, 2, 3],
        remain: '',
      });
    });
    it('throw invalid horizontal lineto command', () => {
      expect(() => horizontalLineto('')).toThrow();
      expect(() => horizontalLineto('H')).toThrow();
    });
  });

  describe('vertical lineto', () => {
    it('parse valid vertical lineto command', () => {
      expect(verticalLineto('v1')).toEqual({ value: ['v', 1], remain: '' });
      expect(verticalLineto('V1')).toEqual({ value: ['V', 1], remain: '' });
      expect(verticalLineto('V1 2')).toEqual({
        value: ['V', 1, 2],
        remain: '',
      });
      expect(verticalLineto('V1,2')).toEqual({
        value: ['V', 1, 2],
        remain: '',
      });
      expect(verticalLineto('V1 2 3')).toEqual({
        value: ['V', 1, 2, 3],
        remain: '',
      });
      expect(verticalLineto('V1 2,3')).toEqual({
        value: ['V', 1, 2, 3],
        remain: '',
      });
    });
    it('throw invalid vertical lineto command', () => {
      expect(() => verticalLineto('')).toThrow();
      expect(() => verticalLineto('V')).toThrow();
    });
  });

  describe('close-path', () => {
    it('parse valid close-path command', () => {
      expect(closePath('z')).toEqual({ value: ['z'], remain: '' });
      expect(closePath('Z')).toEqual({ value: ['Z'], remain: '' });
    });
    it('throw invalid close-path command', () => {
      expect(() => closePath('')).toThrow();
      expect(() => closePath('L')).toThrow();
    });
  });

  describe('svg path', () => {
    it('parse valid svg path', () => {
      expect(path('')).toEqual({ value: [], remain: '' });
      expect(path('L')).toEqual({ value: [], remain: 'L' });
      expect(path('M0 0')).toEqual({ value: [['M', [0, 0]]], remain: '' });
    });
  });

  describe('parse path', () => {
    it('parse svg path', () => {
      expect(parsePath('')).toEqual([]);
      expect(parsePath('M0 0')).toEqual([['M', [0, 0]]]);
      expect(parsePath('M0 1L2 3Z')).toEqual([
        ['M', [0, 1]],
        ['L', [2, 3]],
        ['Z'],
      ]);
      expect(
        parsePath(
          'M0 1L2 3H4V5C0,1 2,3 4,5S0,1 2,3Q0,1 2,3T0,1A10,10,2,1,0,1,2Z',
        ),
      ).toEqual([
        ['M', [0, 1]],
        ['L', [2, 3]],
        ['H', 4],
        ['V', 5],
        [
          'C',
          [
            [0, 1],
            [2, 3],
            [4, 5],
          ],
        ],
        [
          'S',
          [
            [0, 1],
            [2, 3],
          ],
        ],
        [
          'Q',
          [
            [0, 1],
            [2, 3],
          ],
        ],
        ['T', [0, 1]],
        ['A', [10, 10, 2, 1, 0, [1, 2]]],
        ['Z'],
      ]);
      expect(
        parsePath(
          'M0,1 2,3L2 3,4,5H4 5V5 6C0,1 2,3 4,5 0,1 2,3 4,5S0,1 2,3 0,1 2,3Q0,1 2,3 0,1 2,3T0,1 0,1A10,10,2,1,0,1,2 10,10,2,1,0,1,2Z',
        ),
      ).toEqual([
        ['M', [0, 1], [2, 3]],
        ['L', [2, 3], [4, 5]],
        ['H', 4, 5],
        ['V', 5, 6],
        [
          'C',
          [
            [0, 1],
            [2, 3],
            [4, 5],
          ],
          [
            [0, 1],
            [2, 3],
            [4, 5],
          ],
        ],
        [
          'S',
          [
            [0, 1],
            [2, 3],
          ],
          [
            [0, 1],
            [2, 3],
          ],
        ],
        [
          'Q',
          [
            [0, 1],
            [2, 3],
          ],
          [
            [0, 1],
            [2, 3],
          ],
        ],
        ['T', [0, 1], [0, 1]],
        ['A', [10, 10, 2, 1, 0, [1, 2]], [10, 10, 2, 1, 0, [1, 2]]],
        ['Z'],
      ]);
    });
    it('throw invalid svg path', () => {
      expect(() => parsePath('L')).toThrow();
    });
    it('parse compressed path', () => {
      expect(() =>
        parsePath(
          '' +
            'M440.102 79.27c-9.778-16.932-27.509-26.405-45.749-26.418l.003-.003c-18.24-.016-35.974-' +
            '9.488-45.749-26.418-14.586-25.267-46.892-33.922-72.159-19.333l-.004.003v-.016c-15.693 ' +
            '9.041-35.609 9.757-52.466.198A52.578 52.578 0 0 0 197.201 0c-19.551 0-36.619 10.623-45' +
            '.755 26.412v-.003c-9.133 15.786-26.205 26.409-45.753 26.409-29.175 0-52.824 23.649-52.' +
            '824 52.824v.006l-.016-.006c-.016 18.101-9.345 35.698-26.03 45.521a52.552 52.552 0 0 0-' +
            '19.722 19.559c-9.776 16.934-9.111 37.025-.003 52.83h-.003c9.101 15.802 9.766 35.895-.0' +
            '1 52.827-14.585 25.264-5.931 57.57 19.336 72.159l.003.003-.01.007c15.789 9.129 26.407 ' +
            '26.201 26.407 45.752 0 29.175 23.649 52.824 52.823 52.824 19.552 0 36.617 10.621 45.75' +
            '6 26.41 9.133 15.782 26.204 26.41 45.753 26.41a52.61 52.61 0 0 0 26.777-7.284c16.853-9' +
            '.557 36.774-8.841 52.466.203v-.019l.003.006c25.267 14.586 57.573 5.928 72.163-19.336 9' +
            '.775-16.929 27.506-26.403 45.746-26.416l-.004-.007c18.24-.013 35.974-9.487 45.746-26.4' +
            '16 4.813-8.335 7.097-17.439 7.087-26.417l.007.006c.016-17.594 8.832-34.719 24.652-44.6' +
            '82 8.528-4.484 15.929-11.355 21.1-20.312 9.779-16.938 9.114-37.031.007-52.833h.003c-9.' +
            '104-15.802-9.77-35.895.007-52.828 14.589-25.267 5.931-57.57-19.336-72.159l-.004-.004.0' +
            '1-.003c-15.662-9.062-26.236-25.935-26.403-45.291.092-9.134-2.185-18.404-7.078-26.882',
        ),
      ).not.toThrow();
    });
  });
});
