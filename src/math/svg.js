export const PPI = 96;

export const mm2px = (mm) => (PPI / 25.4) * mm;
export const px2mm = (px) => (px / PPI) * 25.4;

export const normalizedDiagonalLength = (viewBox) => {
  const { width, height } = viewBox.baseVal;
  return Math.sqrt(width ** 2 + height ** 2) / Math.sqrt(2);
};
