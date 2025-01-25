import {
  atLeastRe,
  branchesRe,
  composeRe,
  consume,
  fastBranches,
  many,
  manyRe,
  optional,
  optionalRe,
  rule,
  Consumer,
  ExtractConsumedType,
} from './utils';

// The grammar for path data
// we are implementing the svg 1.1 spec
// https://www.w3.org/TR/SVG11/paths.html#PathDataBNF

// wsp:
//     (#x20 | #x9 | #xD | #xA)
const wspRe = /\s/;

// zero or many whitespace
const manyWspRe = manyRe(wspRe);

const manyWsp = consume(manyWspRe);

// one or many whitespace
const atLeastWspRe = atLeastRe(wspRe);

// digit:
//     "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
// digit-sequence:
//     digit
//     | digit digit-sequence
const digitsRe = /\d+/;

// sign:
//     "+" | "-"
const signRe = /[+-]/;

// exponent:
//     ( "e" | "E" ) sign? digit-sequence
const expRe = composeRe(/[Ee]/, optionalRe(signRe), digitsRe);

// dot
export const dotRe = /\./;

// fractional-constant:
//     digit-sequence? "." digit-sequence
//     | digit-sequence "."
const fracConstRe = branchesRe(
  composeRe(optionalRe(digitsRe), dotRe, digitsRe),
  composeRe(digitsRe, dotRe),
);

// floating-point-constant:
//     fractional-constant exponent?
//     | digit-sequence exponent
const floatConstRe = branchesRe(
  composeRe(fracConstRe, optionalRe(expRe)),
  composeRe(digitsRe, expRe),
);

// integer-constant:
//     digit-sequence
const intConstRe = digitsRe;

// comma:
//     ","
const commaRe = /,/;

// comma-wsp:
//     (wsp+ comma? wsp*) | (comma wsp*)
const commaWspRe = branchesRe(
  composeRe(atLeastWspRe, optionalRe(commaRe), manyWspRe),
  composeRe(commaRe, manyWspRe),
);

const commaWsp = consume(commaWspRe);

// optional comma-wsp
const optCommaWsp = consume(optionalRe(commaWspRe));

// flag:
//     "0" | "1"
const flag = rule((f: string) => parseInt(f, 10), consume(/[01]/));

// nonnegative-number:
//     integer-constant
//     | floating-point-constant
export const nonNegNumber = rule(
  (n: string) => parseFloat(n),
  consume(branchesRe(floatConstRe, intConstRe)),
);

// number:
//     sign? integer-constant
//     | sign? floating-point-constant
export const number = rule(
  (n: string) => parseFloat(n),
  consume(composeRe(optionalRe(signRe), branchesRe(floatConstRe, intConstRe))),
);

// coordinate:
//     number
const coordinate = number;

export type numberPair = [number, number];

// coordinate-pair:
//     coordinate comma-wsp? coordinate
export const coordinatePair = rule<numberPair>(
  function CoordinatePair(c0: number, _: string, c1: number) {
    return [c0, c1];
  },
  coordinate,
  optCommaWsp,
  coordinate,
);

// match a sequence with separator
const sequence = <T>(
  itemConsumer: Consumer<T>,
  sepConsumer: Consumer<string> = optCommaWsp,
) =>
  rule<T[]>(
    function Sequence(cp0: T, cps: T[]) {
      return [cp0, ...cps];
    },
    itemConsumer,
    many(
      rule<T>(
        function SequenceNext(_: string, cp0: T) {
          return cp0;
        },
        sepConsumer,
        itemConsumer,
      ),
    ),
  );

// coordinate-pair-sequence:
//     coordinate-pair
//     | coordinate-pair comma-wsp? coordinate-pair-sequence
export const coordinatePairSequence = sequence(coordinatePair);

// match command
const command = <C, T>(
  cmdConsumer: Consumer<C>,
  sequenceComsumer: Consumer<T[]>,
) =>
  rule<[C, ...arr: T[]]>(
    function Command(cmd: C, _: string, args: T[]) {
      return [cmd, ...args];
    },
    cmdConsumer,
    manyWsp,
    sequenceComsumer,
  );

// moveto:
//     ( "M" | "m" ) wsp* moveto-argument-sequence
// moveto-argument-sequence:
//     coordinate-pair
//     | coordinate-pair comma-wsp? lineto-argument-sequence
export const moveto = command(
  consume<'M' | 'm'>(/[Mm]/),
  coordinatePairSequence,
);

// lineto:
//     ( "L" | "l" ) wsp* lineto-argument-sequence
// lineto-argument-sequence:
//     coordinate-pair
//     | coordinate-pair comma-wsp? lineto-argument-sequence
export const lineto = command(
  consume<'L' | 'l'>(/[Ll]/),
  coordinatePairSequence,
);

// closepath:
//     ("Z" | "z")
export const closePath = rule<['Z' | 'z']>(
  (z: 'Z' | 'z') => [z],
  consume(/[Zz]/),
);

// coordinate-sequence:
//     coordinate
//     | coordinate comma-wsp? coordinate-sequence
const coordinateSequence = sequence(coordinate);

// horizontal-lineto:
//     ( "H" | "h" ) wsp* horizontal-lineto-argument-sequence
// horizontal-lineto-argument-sequence:
//     coordinate
//     | coordinate comma-wsp? horizontal-lineto-argument-sequence
export const horizontalLineto = command(
  consume<'H' | 'h'>(/[Hh]/),
  coordinateSequence,
);

// vertical-lineto:
//     ( "V" | "v" ) wsp* vertical-lineto-argument-sequence
// vertical-lineto-argument-sequence:
//     coordinate
//     | coordinate comma-wsp? vertical-lineto-argument-sequence
export const verticalLineto = command(
  consume<'V' | 'v'>(/[Vv]/),
  coordinateSequence,
);

// curveto-argument:
//     coordinate-pair comma-wsp? coordinate-pair comma-wsp? coordinate-pair
const curveToArg = rule<[numberPair, numberPair, numberPair]>(
  (cp0: numberPair, _, cp1: numberPair, __, cp2: numberPair) => [cp0, cp1, cp2],
  coordinatePair,
  optCommaWsp,
  coordinatePair,
  optCommaWsp,
  coordinatePair,
);

// curveto-argument-sequence:
//     curveto-argument
//     | curveto-argument comma-wsp? curveto-argument-sequence
const curvetoArgSequence = sequence(curveToArg);

// curveto:
//     ( "C" | "c" ) wsp* curveto-argument-sequence
const curveTo = command(consume<'C' | 'c'>(/[Cc]/), curvetoArgSequence);

// two-coordinate-pair:
//     coordinate-pair comma-wsp? coordinate-pair
const twoCoordinatePair = rule<[numberPair, numberPair]>(
  (cp0: numberPair, _, cp1: numberPair) => [cp0, cp1],
  coordinatePair,
  optCommaWsp,
  coordinatePair,
);

// two-coordinate-pair-sequence:
//     two-coordinate-pair
//     | two-coordinate-pair comma-wsp? two-coordinate-pair-sequence
const twoCoordinatePairSequence = sequence(twoCoordinatePair);

// smooth-curveto:
//     ( "S" | "s" ) wsp* smooth-curveto-argument-sequence
// smooth-curveto-argument-sequence:
//     smooth-curveto-argument
//     | smooth-curveto-argument comma-wsp? smooth-curveto-argument-sequence
// smooth-curveto-argument:
//     coordinate-pair comma-wsp? coordinate-pair
const smoothCurveTo = command(
  consume<'S' | 's'>(/[Ss]/),
  twoCoordinatePairSequence,
);

// quadratic-bezier-curveto:
//     ( "Q" | "q" ) wsp* quadratic-bezier-curveto-argument-sequence
// quadratic-bezier-curveto-argument-sequence:
//     quadratic-bezier-curveto-argument
//     | quadratic-bezier-curveto-argument comma-wsp?
//         quadratic-bezier-curveto-argument-sequence
// quadratic-bezier-curveto-argument:
//     coordinate-pair comma-wsp? coordinate-pair
const quadBezierCurveTo = command(
  consume<'Q' | 'q'>(/[Qq]/),
  twoCoordinatePairSequence,
);

// smooth-quadratic-bezier-curveto:
//     ( "T" | "t" ) wsp* smooth-quadratic-bezier-curveto-argument-sequence
// smooth-quadratic-bezier-curveto-argument-sequence:
//     coordinate-pair
//     | coordinate-pair comma-wsp? smooth-quadratic-bezier-curveto-argument-sequence
const smoothQuadBezierCurveTo = command(
  consume<'T' | 't'>(/[Tt]/),
  coordinatePairSequence,
);

// elliptical-arc-argument:
//     nonnegative-number comma-wsp? nonnegative-number comma-wsp?
//         number comma-wsp flag comma-wsp? flag comma-wsp? coordinate-pair
const ellipticalArcArg = rule<
  [number, number, number, number, number, numberPair]
>(
  (
    rx: number,
    _0,
    ry: number,
    _1,
    rotate: number,
    _2,
    largeArc: number,
    _3,
    sweep: number,
    _4,
    cp: numberPair,
  ) => [rx, ry, rotate, largeArc, sweep, cp],
  nonNegNumber,
  optCommaWsp,
  nonNegNumber,
  optCommaWsp,
  number,
  commaWsp,
  flag,
  optCommaWsp,
  flag,
  optCommaWsp,
  coordinatePair,
);

// elliptical-arc-argument-sequence:
//     elliptical-arc-argument
//     | elliptical-arc-argument comma-wsp? elliptical-arc-argument-sequence
const ellipticalArcArgSequence = sequence(ellipticalArcArg);

// elliptical-arc:
//     ( "A" | "a" ) wsp* elliptical-arc-argument-sequence
const ellipticalArc = command(
  consume<'A' | 'a'>(/[Aa]/),
  ellipticalArcArgSequence,
);

export type MoveTo = ExtractConsumedType<typeof moveto>;
export type ClosePath = ExtractConsumedType<typeof closePath>;
export type LineTo = ExtractConsumedType<typeof lineto>;
export type HorizontalLineTo = ExtractConsumedType<typeof horizontalLineto>;
export type VerticalLineTo = ExtractConsumedType<typeof verticalLineto>;
export type CurveTo = ExtractConsumedType<typeof curveTo>;
export type SmoothCurveTo = ExtractConsumedType<typeof smoothCurveTo>;
export type QuadBezierCurveTo = ExtractConsumedType<typeof quadBezierCurveTo>;
export type SmoothQuadBezierCurveTo = ExtractConsumedType<
  typeof smoothQuadBezierCurveTo
>;
export type EllipticalArc = ExtractConsumedType<typeof ellipticalArc>;

export type DrawToCommand =
  | ClosePath
  | LineTo
  | HorizontalLineTo
  | VerticalLineTo
  | CurveTo
  | SmoothCurveTo
  | QuadBezierCurveTo
  | SmoothQuadBezierCurveTo
  | EllipticalArc;

// drawto-command:
//     closepath
//     | lineto
//     | horizontal-lineto
//     | vertical-lineto
//     | curveto
//     | smooth-curveto
//     | quadratic-bezier-curveto
//     | smooth-quadratic-bezier-curveto
//     | elliptical-arc
const drawtoCommand = fastBranches<DrawToCommand>({
  Z: closePath,
  L: lineto,
  H: horizontalLineto,
  V: verticalLineto,
  C: curveTo,
  S: smoothCurveTo,
  Q: quadBezierCurveTo,
  T: smoothQuadBezierCurveTo,
  A: ellipticalArc,
});

// drawto-commands:
//     drawto-command
//     | drawto-command wsp* drawto-commands
const drawtoCommands = sequence(drawtoCommand, manyWsp);

// moveto-drawto-command-group:
//     moveto wsp* drawto-commands?
const movetoDrawToGroup = rule(
  function MovetoDrawToGroup(
    m: ExtractConsumedType<typeof moveto>,
    _,
    cmds?: ExtractConsumedType<typeof drawtoCommands>,
  ) {
    return [m, ...(cmds ?? [])];
  },
  moveto,
  manyWsp,
  optional(drawtoCommands),
);

// moveto-drawto-command-groups:
//     moveto-drawto-command-group
//     | moveto-drawto-command-group wsp* moveto-drawto-command-groups
const movetoDrawToGroups = sequence(movetoDrawToGroup, manyWsp);

// svg-path:
//     wsp* moveto-drawto-command-groups? wsp*
export const path = rule(
  function Path(_, cmdG?: ExtractConsumedType<typeof movetoDrawToGroups>) {
    return cmdG ? cmdG.map((i) => i).flat() : null;
  },
  manyWsp,
  optional(movetoDrawToGroups),
  manyWsp,
);

export type Command = MoveTo | DrawToCommand;

export type Path = ExtractConsumedType<typeof path>;

export const parsePath = (pathDef: string = ''): Path => {
  // svg 1.1 allow empty path def
  if (!pathDef) return null;
  const result = path(pathDef, 0);
  if (!result.value) {
    throw new Error('Invalid svg path.');
  }
  return result.value;
};
