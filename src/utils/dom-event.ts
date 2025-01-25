export const preventDefault =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (fn?: (...params: any[]) => void) =>
  (e: { preventDefault: () => void }) => {
    e.preventDefault();
    fn?.(e);
  };
