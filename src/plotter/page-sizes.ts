// Page sizes for every app that puts a page on the plotter: the plotter app,
// the composer and the virtual plotter.

export type PageSize = {
  id: string;
  name: string;
  // the size of the page as it lies on the plotter, landscape: the width is
  // the long side, along the plotter's x
  width: number; // mm
  height: number; // mm
  // how the size is known, for its label
  unit: 'mm' | 'in';
  // the padding a page of this size starts with
  defaultPadding: number; // mm
};

const INCH = 25.4; // mm

// to 0.01 mm, which spares 215.89999999999998 for 8.5 in
const round = (value: number) => Math.round(value * 100) / 100;

const mm = (
  id: string,
  name: string,
  width: number,
  height: number,
  defaultPadding: number,
): PageSize => ({ id, name, width, height, unit: 'mm', defaultPadding });

const inches = (
  id: string,
  name: string,
  width: number,
  height: number,
  defaultPadding: number,
): PageSize => ({
  id,
  name,
  width: round(width * INCH),
  height: round(height * INCH),
  unit: 'in',
  defaultPadding,
});

export const pageSizeGroups: { name: string; sizes: PageSize[] }[] = [
  {
    name: 'ISO A',
    sizes: [
      mm('a1', 'A1', 841, 594, 40),
      mm('a2', 'A2', 594, 420, 30),
      mm('a3', 'A3', 420, 297, 20),
      mm('a4', 'A4', 297, 210, 15),
      mm('a5', 'A5', 210, 148, 10),
      mm('a6', 'A6', 148, 105, 5),
    ],
  },
  {
    name: 'ISO B',
    sizes: [
      mm('b4', 'B4', 353, 250, 20),
      mm('b5', 'B5', 250, 176, 10),
      mm('b6', 'B6', 176, 125, 10),
    ],
  },
  {
    name: 'US',
    sizes: [
      inches('tabloid', 'Tabloid', 17, 11, 20),
      inches('legal', 'Legal', 14, 8.5, 15),
      inches('letter', 'Letter', 11, 8.5, 15),
      inches('half-letter', 'Half Letter', 8.5, 5.5, 10),
    ],
  },
  {
    name: 'Cards and art paper',
    sizes: [
      inches('art-11x14', 'Art', 14, 11, 20),
      inches('art-9x12', 'Art', 12, 9, 15),
      inches('card-5x7', 'Card', 7, 5, 10),
      inches('card-4x6', 'Postcard', 6, 4, 5),
    ],
  },
  {
    // the whole of each AxiDraw's pen travel
    name: 'AxiDraw plot area',
    sizes: [
      mm('axidraw-se-a1', 'AxiDraw SE/A1', 864, 594, 40),
      mm('axidraw-se-a2', 'AxiDraw SE/A2', 594, 432, 30),
      mm('axidraw-a3', 'AxiDraw V3/A3, SE/A3', 430, 297, 20),
      mm('axidraw-v3', 'AxiDraw V3', 300, 218, 15),
      mm('axidraw-v3-b6', 'AxiDraw V3/B6', 190, 140, 10),
      mm('axidraw-minikit-2', 'AxiDraw MiniKit 2', 160, 101, 5),
    ],
  },
];

export const pageSizes = pageSizeGroups.flatMap(({ sizes }) => sizes);

export const defaultPageSize = pageSizes.find(({ id }) => id === 'a4')!;

// the size with that id, or A4 for one this version doesn't know
export const findPageSize = (id?: string | null): PageSize =>
  pageSizes.find((size) => size.id === id) ?? defaultPageSize;

const format = (value: number) => String(Number(value.toFixed(2)));

// e.g. "A4 (297 × 210 mm)" or "Letter (11 × 8.5 in)"
export const pageSizeLabel = ({ name, width, height, unit }: PageSize) =>
  unit === 'in'
    ? `${name} (${format(width / INCH)} × ${format(height / INCH)} in)`
    : `${name} (${format(width)} × ${format(height)} mm)`;
