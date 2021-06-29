export const PPI = 96;

export const mm2px = (mm) => (PPI / 25.4) * mm;
export const px2mm = (px) => (px / PPI) * 25.4;

export const createScreenToPaperMatrix = (orientation, paperSize) => {
  const scale = px2mm(1);
  const scaleMatrix = new DOMMatrix();
  scaleMatrix.scaleSelf(scale);
  if (orientation === 'landscape') {
    return scaleMatrix;
  }
  const translateMatrix = new DOMMatrix();
  translateMatrix.translateSelf(-paperSize.height, 0);
  const rotateMatrix = new DOMMatrix();
  rotateMatrix.rotateSelf(0, 0, -90);
  return rotateMatrix.multiply(translateMatrix).multiply(scaleMatrix);
};
