// The grammar for path data
// we are implementing the svg 1.1 spec
// https://www.w3.org/TR/SVG11/paths.html#PathDataBNF

export const NOT_MATCH = {};

export const composeRe = (...res) => {
  const source = res.reduce((src, re) => src + re.source, '');
  return new RegExp(source);
};

export const branchesRe = (...res) => {
  const source = res.map((re) => re.source).join('|');
  return new RegExp(`(${source})`);
};

export const optionalRe = (re) => new RegExp(`(${re.source})?`);

export const atLeastRe = (re) => new RegExp(`(${re.source})+`);

export const manyRe = (re) => new RegExp(`(${re.source})*`);

// match a branches of consumer
export const fastBranches = (consumerDict) =>
  function FastBranches(s) {
    const peek = s[0];
    const consumer = consumerDict[peek?.toUpperCase()];
    if (!consumer) {
      throw NOT_MATCH;
    }
    return consumer(s);
  };

// match a group of consumers
export const rule = (transform, ...consumers) =>
  function Rule(s) {
    const results = consumers.reduce(
      function RuleReducer(context, consumer) {
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
export const consume = (regex) => {
  let normalizedRe = regex;
  if (!regex.source?.startsWith('^')) {
    normalizedRe = composeRe(/^/, regex);
  }
  return function Consume(s) {
    const ret = normalizedRe.exec(s);
    if (!ret) throw NOT_MATCH;
    const value = ret[0];
    const consumed = value.length;
    const remain = s.substr(consumed);
    return { remain, value };
  };
};

// match zero or one, return defaultValue or matched single value
export const optional = (consumer, defaultValue = null) =>
  function Optional(s) {
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
export const many = (consumer) =>
  function Many(s) {
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

// wsp:
//     (#x20 | #x9 | #xD | #xA)
export const wspRe = /\s/;

// zero or many whitespace
export const manyWspRe = manyRe(wspRe);

export const manyWsp = consume(manyWspRe);

// one or many whitespace
export const atLeastWspRe = atLeastRe(wspRe);

// digit:
//     "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
// digit-sequence:
//     digit
//     | digit digit-sequence
export const digitsRe = /\d+/;

// sign:
//     "+" | "-"
export const signRe = /[+-]/;

// exponent:
//     ( "e" | "E" ) sign? digit-sequence
export const expRe = composeRe(/[Ee]/, optionalRe(signRe), digitsRe);

// dot
export const dotRe = /\./;

// fractional-constant:
//     digit-sequence? "." digit-sequence
//     | digit-sequence "."
export const fracConstRe = branchesRe(
  composeRe(optionalRe(digitsRe), dotRe, digitsRe),
  composeRe(digitsRe, dotRe),
);

// floating-point-constant:
//     fractional-constant exponent?
//     | digit-sequence exponent
export const floatConstRe = branchesRe(
  composeRe(fracConstRe, optionalRe(expRe)),
  composeRe(digitsRe, expRe),
);

// integer-constant:
//     digit-sequence
export const intConstRe = digitsRe;

// comma:
//     ","
export const commaRe = /,/;

// comma-wsp:
//     (wsp+ comma? wsp*) | (comma wsp*)
const commaWspRe = branchesRe(
  composeRe(atLeastWspRe, optionalRe(commaRe), manyWspRe),
  composeRe(commaRe, manyWspRe),
);

export const commaWsp = consume(commaWspRe);

// optional comma-wsp
export const optCommaWsp = consume(optionalRe(commaWspRe));

// flag:
//     "0" | "1"
export const flag = rule((f) => parseInt(f, 10), consume(/^[01]/));

// nonnegative-number:
//     integer-constant
//     | floating-point-constant
export const nonNegNumber = rule(
  (n) => parseFloat(n),
  consume(branchesRe(floatConstRe, intConstRe)),
);

// number:
//     sign? integer-constant
//     | sign? floating-point-constant
export const number = rule(
  (n) => parseFloat(n),
  consume(composeRe(optionalRe(signRe), branchesRe(floatConstRe, intConstRe))),
);

// coordinate:
//     number
export const coordinate = number;

// coordinate-pair:
//     coordinate comma-wsp? coordinate
export const coordinatePair = rule(
  function CoordinatePair(c0, _, c1) {
    return [c0, c1];
  },
  coordinate,
  optCommaWsp,
  coordinate,
);

// match a sequence with separator
export const sequence = (itemConsumer, sepConsumer = optCommaWsp) =>
  rule(
    function Sequence(cp0, cps) {
      return [cp0, ...cps];
    },
    itemConsumer,
    // eslint-disable-next-line no-use-before-define
    many(
      rule(
        function SequenceNext(_, cp0) {
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
export const command = (cmdConsumer, sequenceComsumer) =>
  rule(
    function Command(cmd, _, args) {
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
export const drawtoCommand = fastBranches({
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
export const drawtoCommands = sequence(drawtoCommand, manyWsp);

// moveto-drawto-command-group:
//     moveto wsp* drawto-commands?
export const movetoDrawToGroup = rule(
  function MovetoDrawToGroup(m, _, cmds) {
    return [m, ...(cmds || [])];
  },
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
export const path = rule(
  function Path(_, cmdG) {
    return cmdG?.flatMap((i) => i) || [];
  },
  manyWsp,
  optional(movetoDrawToGroups),
  manyWsp,
);

export const parsePath = (pathDef) => {
  const result = path(pathDef);
  if (result.remain) {
    throw new Error('Invalid svg path.');
  }
  return result.value;
};
