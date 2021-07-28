import {
  closePath,
  coordinatePair,
  coordinatePairSequence,
  floatConst,
  intConst,
  lineto,
  moveto,
  nonNegNumber,
  number,
  parsePath,
  svgPath,
} from '../svg-path';

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
      expect(svgPath('')).toEqual({ value: [], remain: '' });
      expect(svgPath('L')).toEqual({ value: [], remain: 'L' });
      expect(svgPath('M0 0')).toEqual({ value: [['M', [0, 0]]], remain: '' });
    });
  });

  describe('parse path', () => {
    it('parse svg path', () => {
      expect(parsePath('')).toEqual([]);
      expect(parsePath('M0 0')).toEqual([['M', [0, 0]]]);
    });
    it('throw invalid svg path', () => {
      expect(() => parsePath('L')).toThrow();
    });
  });
});
