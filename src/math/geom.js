export const lineLengthSQ = (line) =>
  (line[0] - line[2]) ** 2 + (line[1] - line[3]) ** 2;

export const lineLength = (line) =>
  Math.sqrt((line[0] - line[2]) ** 2 + (line[1] - line[3]) ** 2);
