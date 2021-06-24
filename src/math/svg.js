export const PPI = 96;

export const mm2px = (mm) => (PPI / 25.4) * mm;
export const px2mm = (px) => (px / PPI) * 25.4;
