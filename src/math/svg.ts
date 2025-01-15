export const PPI = 96;

export const mm2px = (mm: number) => (PPI / 25.4) * mm;
export const px2mm = (px: number) => (px / PPI) * 25.4;

export const normalizedDiagonalLength = (viewBox: {
  baseVal: { width: number; height: number };
}) => {
  const { width, height } = viewBox.baseVal;
  return Math.sqrt(width ** 2 + height ** 2) / Math.sqrt(2);
};
