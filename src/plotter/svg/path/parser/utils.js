export const NOT_MATCH = {};

/* regex utils */

export const nonCapturingRe = (re) => new RegExp(`(?:${re.source})`);

export const composeRe = (...res) => {
  const source = res.reduce((src, re) => src + re.source, '');
  return new RegExp(source);
};

export const branchesRe = (...res) => {
  const source = res.map((re) => re.source).join('|');
  return new RegExp(`(?:${source})`);
};

export const optionalRe = (re) => new RegExp(`(?:${re.source})?`);

export const atLeastRe = (re) => new RegExp(`(?:${re.source})+`);

export const manyRe = (re) => new RegExp(`(?:${re.source})*`);

/* parse utils */

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
