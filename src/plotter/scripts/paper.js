/* global SVG */
import { mm2px } from '../../math/svg.js';
import { PAGE_SIZE_A4, PAGE_SIZE_A5, PAGE_SIZE_A6 } from './consts.js';

const { preview } = window;

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

export const getPageSize = (pageType) =>
  pageSizes.find((pageSize) => pageSize.type === pageType);

export const defaultPageSize = getPageSize(PAGE_SIZE_A4);

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

const pageArea = page.rect().id('page-area');

const pagePrintable = page.rect().id('page-printable').attr({
  fill: 'none',
  stroke: '#b8b8b8',
  'stroke-width': '1',
  'stroke-dasharray': '5,5',
});

const gizmo = page.group().id('gizmo').fill('none');
gizmo
  .polyline([0, 0, mm2px(10), 0, mm2px(8), mm2px(-2)])
  .stroke({ width: '1mm', color: '#ff0000' });
gizmo
  .polyline([0, 0, 0, mm2px(10), mm2px(-2), mm2px(8)])
  .stroke({ width: '1mm', color: '#00ff00' });
gizmo.circle(mm2px(3)).attr({ cx: 0, cy: 0 }).fill('#0000ff');

canvas.group().id('loader');
canvas.group().id('planner');

export function adjustPreview(svg) {
  svg
    .size(pagePrintable.width(), pagePrintable.height())
    .move(pagePrintable.x(), pagePrintable.y());
  if (preview['page-fit'].checked) {
    svg.viewbox(svg.bbox());
  } else {
    svg.viewbox(svg.attr('data-original-viewBox'));
  }
  const alignmentX = preview['page-align-h'].value;
  const alignmentY = preview['page-align-v'].value;
  svg.attr({
    preserveAspectRatio: `${alignmentX}${alignmentY} meet`,
  });
}

export const updatePage = () => {
  const pageSize = getPageSize(preview['page-size'].value) || defaultPageSize;
  let width = mm2px(pageSize.width);
  let height = mm2px(pageSize.height);
  gizmo.attr('transform', null);
  if (preview.orientation.value === 'portrait') {
    [width, height] = [height, width];
    gizmo.rotate(90, 0, 0).translate(width);
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

updatePage();
