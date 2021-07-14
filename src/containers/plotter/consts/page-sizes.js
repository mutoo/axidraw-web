export const PAGE_SIZE_A4 = 'axidraw-web-page-size-a4';
export const PAGE_SIZE_A5 = 'axidraw-web-page-size-a5';
export const PAGE_SIZE_A6 = 'axidraw-web-page-size-a6';

export const pageSizes = [
  {
    type: PAGE_SIZE_A4,
    width: 297,
    height: 210,
    defaultPadding: 15,
  },
  {
    type: PAGE_SIZE_A5,
    width: 210,
    height: 148,
    defaultPadding: 10,
  },
  {
    type: PAGE_SIZE_A6,
    width: 148,
    height: 105,
    defaultPadding: 5,
  },
];

export const defaultPageSize = pageSizes[0];
