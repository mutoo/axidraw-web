// eslint-disable-next-line import/prefer-default-export
export const delay = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const timeout = (ms, message) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(message));
    }, ms);
  });
};

export const formatTime = (second) => {
  if (!second) return '0m0s';
  let rest = second | 0;
  const sec = rest % 60;
  rest = (second / 60) | 0;
  const min = rest % 60;
  rest = (min / 60) | 0;
  const hour = rest % 60;
  rest = (hour / 60) | 0;
  if (rest) {
    return 'more than 1 hour';
  }
  if (hour) return `${hour}h${min}m${sec}s`;
  return `${min}m${sec}s`;
};
