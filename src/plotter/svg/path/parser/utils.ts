export class NotMatchError extends Error {
  constructor() {
    super('Not match');
  }
}

/* regex utils */

export const composeRe = (...res: RegExp[]) => {
  const source = res.reduce((src, re) => src + re.source, '');
  return new RegExp(source);
};

export const branchesRe = (...res: RegExp[]) => {
  const source = res.map((re) => re.source).join('|');
  return new RegExp(`(?:${source})`);
};

export const optionalRe = (re: RegExp) => new RegExp(`(?:${re.source})?`);

export const atLeastRe = (re: RegExp) => new RegExp(`(?:${re.source})+`);

export const manyRe = (re: RegExp) => new RegExp(`(?:${re.source})*`);

/* parse utils */

export type Consumer<T> = (
  s: string,
  idx?: number,
) => { idx: number; value: T };

export type ExtractConsumedType<T> = T extends Consumer<infer R> ? R : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Transformer<T> = (...args: any[]) => T;

// match a branches of consumer
export const fastBranches = <T>(
  consumerDict: Record<string, Consumer<T>>,
): Consumer<T> =>
  function FastBranches(s: string, idx = 0) {
    const peek = s.at(idx)?.toUpperCase();
    const consumer = peek && consumerDict[peek];
    if (!consumer) {
      throw new NotMatchError();
    }
    return consumer(s, idx);
  };

// match a group of consumers
export const rule = <T>(
  transform: Transformer<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...consumers: Consumer<any>[]
): Consumer<T> =>
  function Rule(s, idx = 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = consumers.reduce<{ idx: number; values: any[] }>(
      function RuleReducer(context, consumer) {
        const ret = consumer(s, context.idx);
        context.idx = ret.idx;
        context.values.push(ret.value);
        return context;
      },
      { idx, values: [] },
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return { idx: results.idx, value: transform(...results.values) };
  };

// match regex, return null or single string
export const consume = <T = string>(regex: RegExp): Consumer<T> => {
  const normalizedRe = new RegExp(regex.source, 'y');
  return function Consume(s, idx = 0) {
    normalizedRe.lastIndex = idx;
    const ret = normalizedRe.exec(s);
    if (!ret) throw new NotMatchError();
    const value = ret[0] as T;
    return { idx: normalizedRe.lastIndex, value };
  };
};

// match zero or one, return defaultValue or matched single value
export const optional = <T>(
  consumer: Consumer<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue: any = null,
): Consumer<T> =>
  function Optional(s, idx = 0) {
    try {
      return consumer(s, idx);
    } catch (e) {
      if (e instanceof NotMatchError) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        return { idx, value: defaultValue };
      }
      throw e;
    }
  };

// match zero or more, return in array
export const many = <T>(consumer: Consumer<T>): Consumer<T[]> =>
  function Many(s, idx = 0) {
    const values: T[] = [];
    let lastIdx = idx;
    for (;;) {
      try {
        const ret = consumer(s, lastIdx);
        values.push(ret.value);
        lastIdx = ret.idx;
      } catch (e) {
        if (e instanceof NotMatchError) {
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
