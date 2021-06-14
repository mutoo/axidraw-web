// eslint-disable-next-line import/prefer-default-export
export const delay = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
