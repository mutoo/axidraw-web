export const NOT_MATCH = {};

/* regex utils */

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
  function FastBranches(s, idx = 0) {
    const peek = s[idx];
    const consumer = consumerDict[peek?.toUpperCase()];
    if (!consumer) {
      throw NOT_MATCH;
    }
    return consumer(s, idx);
  };

// match a group of consumers
export const rule = (transform, ...consumers) =>
  function Rule(s, idx = 0) {
    const results = consumers.reduce(
      function RuleReducer(context, consumer) {
        const ret = consumer(s, context.idx);
        context.idx = ret.idx;
        context.values.push(ret.value);
        return context;
      },
      { idx, values: [] },
    );
    return { idx: results.idx, value: transform(...results.values) };
  };

// match regex, return null or single string
export const consume = (regex) => {
  const normalizedRe = new RegExp(regex?.source || '', 'y');
  return function Consume(s, idx = 0) {
    normalizedRe.lastIndex = idx;
    const ret = normalizedRe.exec(s);
    if (!ret) throw NOT_MATCH;
    const value = ret[0];
    return { idx: normalizedRe.lastIndex, value };
  };
};

// match zero or one, return defaultValue or matched single value
export const optional = (consumer, defaultValue = null) =>
  function Optional(s, idx) {
    try {
      return consumer(s, idx);
    } catch (e) {
      if (e === NOT_MATCH) {
        return { idx, value: defaultValue };
      }
      throw e;
    }
  };

// match zero or more, return in array
export const many = (consumer) =>
  function Many(s, idx = 0) {
    const values = [];
    let lastIdx = idx;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const ret = consumer(s, lastIdx);
        values.push(ret.value);
        lastIdx = ret.idx;
      } catch (e) {
        if (e === NOT_MATCH) {
          break;
        } else {
          throw e;
        }
      }
    }
    return {
      idx: lastIdx,
      value: values,
    };
  };
