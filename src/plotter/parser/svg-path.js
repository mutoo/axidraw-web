// The grammar for path data
// we are implementing the svg 1.1 spec
// https://www.w3.org/TR/SVG11/paths.html#PathDataBNF

export const NOT_MATCH = {};

// match a branches of consumer, return first match
export const branches =
  (...consumers) =>
  (s) => {
    for (const consumer of consumers) {
      try {
        return consumer(s);
      } catch (e) {
        if (e !== NOT_MATCH) {
          throw e;
        }
      }
    }
    throw NOT_MATCH;
  };

// match a group of consumers
export const rule =
  (transform, ...consumers) =>
  (s) => {
    const results = consumers.reduce(
      (context, consumer) => {
        const ret = consumer(context.remain);
        context.remain = ret.remain;
        context.values.push(ret.value);
        return context;
      },
      { remain: s, values: [] },
    );
    return { remain: results.remain, value: transform(...results.values) };
  };

// match regex, return null or single string
export const consume = (regex) => (s) => {
  const ret = regex.exec(s);
  if (!ret) throw NOT_MATCH;
  const value = ret[0];
  const consumed = value.length;
  const remain = s.substr(consumed);
  return { remain, value };
};

// match zero or one, return defaultValue or matched single value
export const optional =
  (consumer, defaultValue = null) =>
  (s) => {
    try {
      return consumer(s);
    } catch (e) {
      if (e === NOT_MATCH) {
        return { remain: s, value: defaultValue };
      }
      throw e;
    }
  };

// match zero or more, return in array
export const many = (consumer) => (s) => {
  const values = [];
  let remain = s;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const ret = consumer(remain);
      values.push(ret.value);
      remain = ret.remain;
    } catch (e) {
      if (e === NOT_MATCH) {
        break;
      } else {
        throw e;
      }
    }
  }
  return {
    remain,
    value: values,
  };
};

// match one or more, return in array
export const atLeastOne = (consumer) => (s) => {
  const ret = consumer(s);
  const manyConsumer = many(consumer);
  const manyRet = manyConsumer(ret.remain);
  return { remain: manyRet.remain, value: [ret.value, ...manyRet.value] };
};

// match .
export const dot = consume(/^\./);

// wsp:
//     (#x20 | #x9 | #xD | #xA)
export const wsp = consume(/^\s/);

// many whitespace
export const manyWsp = many(wsp);

// digit:
//     "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
export const digit = consume(/^[0-9]/);

// digit-sequence:
//     digit
//     | digit digit-sequence
export const digits = consume(/^[0-9]+/);

// sign:
//     "+" | "-"
export const sign = consume(/^[+-]/);

// exponent:
//     ( "e" | "E" ) sign? digit-sequence
export const exp = rule(
  (e, s, ds) => e + s + ds,
  consume(/^E/i),
  optional(sign, ''),
  digits,
);

// fractional-constant:
//     digit-sequence? "." digit-sequence
//     | digit-sequence "."
export const frac = branches(
  rule((ds0, _, ds1) => `${ds0}.${ds1}`, optional(digits, ''), dot, digits),
  rule((ds0) => ds0, digits, dot),
);

// floating-point-constant:
//     fractional-constant exponent?
//     | digit-sequence exponent
export const floatConst = branches(
  rule((f, e) => f + e, frac, optional(exp, '')),
  rule((ds, e) => ds + e, digits, exp),
);

// integer-constant:
//     digit-sequence
export const intConst = digits;

// comma:
//     ","
export const comma = consume(/^,/);

// optional comma
export const optComma = optional(comma);

// comma-wsp:
//     (wsp+ comma? wsp*) | (comma wsp*)
export const commaWsp = branches(
  rule(() => null, atLeastOne(wsp), optComma, manyWsp),
  rule(() => null, optComma, manyWsp),
);

// optional comma-wsp
export const optCommaWsp = optional(commaWsp);

// flag:
//     "0" | "1"
export const flag = rule((f) => parseInt(f, 10), consume(/^[01]/));

// nonnegative-number:
//     integer-constant
//     | floating-point-constant
export const nonNegNumber = branches(
  rule((fc) => parseFloat(fc), floatConst),
  rule((ic) => parseInt(ic, 10), intConst),
);

// number:
//     sign? integer-constant
//     | sign? floating-point-constant
export const number = branches(
  rule((s, fc) => parseFloat(s + fc), optional(sign, '+'), floatConst),
  rule((s, ic) => parseInt(s + ic, 10), optional(sign, '+'), intConst),
);

// coordinate:
//     number
export const coordinate = number;

// coordinate-pair:
//     coordinate comma-wsp? coordinate
export const coordinatePair = rule(
  (c0, _, c1) => [c0, c1],
  coordinate,
  optCommaWsp,
  coordinate,
);

// match a sequence with separator
export const sequence = (itemConsumer, sepConsumer = optCommaWsp) =>
  rule(
    (cp0, cps) => [cp0, ...cps],
    itemConsumer,
    // eslint-disable-next-line no-use-before-define
    many(rule((_, cp0) => cp0, sepConsumer, itemConsumer)),
  );

// coordinate-pair-sequence:
//     coordinate-pair
//     | coordinate-pair comma-wsp? coordinate-pair-sequence
export const coordinatePairSequence = sequence(coordinatePair);

// match command
export const command = (cmdConsumer, sequenceComsumer) =>
  rule(
    (cmd, _, args) => [cmd, ...args],
    cmdConsumer,
    manyWsp,
    sequenceComsumer,
  );

// moveto:
//     ( "M" | "m" ) wsp* moveto-argument-sequence
// moveto-argument-sequence:
//     coordinate-pair
//     | coordinate-pair comma-wsp? lineto-argument-sequence
export const moveto = command(consume(/^M/i), coordinatePairSequence);

// lineto:
//     ( "L" | "l" ) wsp* lineto-argument-sequence
// lineto-argument-sequence:
//     coordinate-pair
//     | coordinate-pair comma-wsp? lineto-argument-sequence
export const lineto = command(consume(/^L/i), coordinatePairSequence);

// closepath:
//     ("Z" | "z")
export const closePath = rule((z) => [z], consume(/^Z/i));

// coordinate-sequence:
//     coordinate
//     | coordinate comma-wsp? coordinate-sequence
export const coordinateSequence = sequence(coordinate);

// horizontal-lineto:
//     ( "H" | "h" ) wsp* horizontal-lineto-argument-sequence
// horizontal-lineto-argument-sequence:
//     coordinate
//     | coordinate comma-wsp? horizontal-lineto-argument-sequence
export const horizontalLineto = command(consume(/^H/i), coordinateSequence);

// vertical-lineto:
//     ( "V" | "v" ) wsp* vertical-lineto-argument-sequence
// vertical-lineto-argument-sequence:
//     coordinate
//     | coordinate comma-wsp? vertical-lineto-argument-sequence
export const verticalLineto = command(consume(/^V/i), coordinateSequence);

// curveto-argument:
//     coordinate-pair comma-wsp? coordinate-pair comma-wsp? coordinate-pair
export const curveToArg = rule(
  (cp0, _, cp1, __, cp2) => [cp0, cp1, cp2],
  coordinatePair,
  optCommaWsp,
  coordinatePair,
  optCommaWsp,
  coordinatePair,
);

// curveto-argument-sequence:
//     curveto-argument
//     | curveto-argument comma-wsp? curveto-argument-sequence
export const curvetoArgSequence = sequence(curveToArg);

// curveto:
//     ( "C" | "c" ) wsp* curveto-argument-sequence
export const curveTo = command(consume(/^C/i), curvetoArgSequence);

// two-coordinate-pair:
//     coordinate-pair comma-wsp? coordinate-pair
export const twoCoordinatePair = rule(
  (cp0, _, cp1) => [cp0, cp1],
  coordinatePair,
  optCommaWsp,
  coordinatePair,
);

// two-coordinate-pair-sequence:
//     two-coordinate-pair
//     | two-coordinate-pair comma-wsp? two-coordinate-pair-sequence
export const twoCoordinatePairSequence = sequence(twoCoordinatePair);

// smooth-curveto:
//     ( "S" | "s" ) wsp* smooth-curveto-argument-sequence
// smooth-curveto-argument-sequence:
//     smooth-curveto-argument
//     | smooth-curveto-argument comma-wsp? smooth-curveto-argument-sequence
// smooth-curveto-argument:
//     coordinate-pair comma-wsp? coordinate-pair
export const smoothCurveTo = command(consume(/^S/i), twoCoordinatePairSequence);

// quadratic-bezier-curveto:
//     ( "Q" | "q" ) wsp* quadratic-bezier-curveto-argument-sequence
// quadratic-bezier-curveto-argument-sequence:
//     quadratic-bezier-curveto-argument
//     | quadratic-bezier-curveto-argument comma-wsp?
//         quadratic-bezier-curveto-argument-sequence
// quadratic-bezier-curveto-argument:
//     coordinate-pair comma-wsp? coordinate-pair
export const quadBezierCurveTo = command(
  consume(/^Q/i),
  twoCoordinatePairSequence,
);

// smooth-quadratic-bezier-curveto:
//     ( "T" | "t" ) wsp* smooth-quadratic-bezier-curveto-argument-sequence
// smooth-quadratic-bezier-curveto-argument-sequence:
//     coordinate-pair
//     | coordinate-pair comma-wsp? smooth-quadratic-bezier-curveto-argument-sequence
export const smoothQuadBezierCurveTo = command(
  consume(/^T/i),
  coordinatePairSequence,
);

// elliptical-arc-argument:
//     nonnegative-number comma-wsp? nonnegative-number comma-wsp?
//         number comma-wsp flag comma-wsp? flag comma-wsp? coordinate-pair
export const ellipticalArcArg = rule(
  (rx, _, ry, __, rotate, ___, largeArc, ____, sweep, _____, cp) => [
    rx,
    ry,
    rotate,
    largeArc,
    sweep,
    cp,
  ],
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
export const ellipticalArcArgSequence = sequence(ellipticalArcArg);

// elliptical-arc:
//     ( "A" | "a" ) wsp* elliptical-arc-argument-sequence
export const ellipticalArc = command(consume(/^A/i), ellipticalArcArgSequence);

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
export const drawtoCommand = branches(
  closePath,
  lineto,
  horizontalLineto,
  verticalLineto,
  curveTo,
  smoothCurveTo,
  quadBezierCurveTo,
  smoothQuadBezierCurveTo,
  ellipticalArc,
);

// drawto-commands:
//     drawto-command
//     | drawto-command wsp* drawto-commands
export const drawtoCommands = sequence(drawtoCommand, manyWsp);

// moveto-drawto-command-group:
//     moveto wsp* drawto-commands?
export const movetoDrawToGroup = rule(
  (m, _, cmds) => [m, ...(cmds || [])],
  moveto,
  manyWsp,
  optional(drawtoCommands),
);

// moveto-drawto-command-groups:
//     moveto-drawto-command-group
//     | moveto-drawto-command-group wsp* moveto-drawto-command-groups
export const movetoDrawToGroups = sequence(movetoDrawToGroup, manyWsp);

// svg-path:
//     wsp* moveto-drawto-command-groups? wsp*
export const svgPath = rule(
  (_, cmdG) => cmdG?.flatMap((i) => i) || [],
  manyWsp,
  optional(movetoDrawToGroups),
  manyWsp,
);

export const parsePath = (pathDef) => {
  const result = svgPath(pathDef);
  if (result.remain) {
    throw new Error('Invalid svg path.');
  }
  return result.value;
};
