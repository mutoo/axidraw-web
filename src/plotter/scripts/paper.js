/* global SVG */
import { mm2px } from '../../math/svg.js';
import { PAGE_SIZE_A4, PAGE_SIZE_A5, PAGE_SIZE_A6 } from './consts.js';

export const pageSizes = [
  {
    type: PAGE_SIZE_A4,
    width: 297,
    height: 210,
    defaultPadding: 20,
  },
  {
    type: PAGE_SIZE_A5,
    width: 210,
    height: 148,
    defaultPadding: 12,
  },
  {
    type: PAGE_SIZE_A6,
    width: 148,
    height: 105,
    defaultPadding: 10,
  },
];

const { preview } = window;

pageSizes.forEach((pageSize) => {
  const option = document.createElement('option');
  option.value = pageSize.type;
  option.innerText = `${pageSize.type.toUpperCase()} (${pageSize.width}mm x ${
    pageSize.height
  }mm)`;
  preview['page-size'].append(option);
});

export const getPageSize = (pageType) =>
  pageSizes.find((pageSize) => pageSize.type === pageType);

const defaultPageSize = getPageSize(PAGE_SIZE_A4);
preview['page-size'].value = defaultPageSize.type;
preview['page-padding'].value = defaultPageSize.defaultPadding;

export const margin = mm2px(20);

const canvas = SVG()
  .id('canvas')
  .attr('preserveAspectRatio', 'xMidYMid meet')
  .addTo('#workspace');

const page = canvas.group().id('page');

const dropShadow = canvas.defs().filter();
const blur = dropShadow
  .offset(0, 0)
  .in(dropShadow.$sourceAlpha)
  .gaussianBlur(margin / 4);
dropShadow.blend(dropShadow.$source, blur);

const pageShadow = page
  .rect()
  .id('page-shadow')
  .attr({ fill: 'rgba(0,0,0,0.25)' })
  .filterWith(dropShadow);

const pageArea = page.rect().id('page-area').attr({ fill: 'white' });

const pagePrintable = page.rect().id('page-printable').attr({
  fill: 'none',
  stroke: '#333',
  'stroke-width': '0.1mm',
  'stroke-dasharray': '5,5',
});

canvas.group().id('loader');

export function adjustPreview(svg) {
  svg
    .size(pagePrintable.width(), pagePrintable.height())
    .move(pagePrintable.x(), pagePrintable.y());
  if (preview['page-fit'].checked) {
    svg.viewbox(svg.bbox());
  } else {
    svg.viewbox(svg.attr('data-original-viewBox'));
  }
}

const updatePage = () => {
  const pageSize = getPageSize(preview['page-size'].value) || defaultPageSize;
  let width = mm2px(pageSize.width);
  let height = mm2px(pageSize.height);
  if (preview.orientation.value === 'portrait') {
    [width, height] = [height, width];
  }

  const padding = mm2px(preview['page-padding'].value || 20);

  canvas.viewbox(-margin, -margin, width + margin * 2, height + margin * 2);
  pageShadow.size(width, height);
  pageArea.size(width, height);
  pagePrintable
    .size(width - padding * 2, height - padding * 2)
    .move(padding, padding);

  const imported = SVG('#imported');
  if (imported) {
    adjustPreview(imported);
  }
};

preview['page-size'].addEventListener('change', (e) => {
  const pageSize = getPageSize(e.target.value);
  preview['page-padding'].value = pageSize.defaultPadding;
  updatePage();
});
preview['page-padding'].addEventListener('change', updatePage);
preview['page-fit'].addEventListener('change', updatePage);
preview['orientation-landscape'].addEventListener('change', updatePage);
preview['orientation-portrait'].addEventListener('change', updatePage);

updatePage();
