// eslint-disable-next-line import/prefer-default-export
export const preventDefault = (fn) => (e) => {
  e.preventDefault();
  fn?.(e);
};
