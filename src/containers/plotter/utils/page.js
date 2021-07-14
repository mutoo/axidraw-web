export const getWidth = (pageSize, orientation) => {
  return orientation === 'landscape' ? pageSize.width : pageSize.height;
};

export const getHeight = (pageSize, orientation) => {
  return orientation === 'landscape' ? pageSize.height : pageSize.width;
};
