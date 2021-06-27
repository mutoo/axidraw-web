/* global SVG */
import {
  defaultPageSize,
  getPageSize,
  pageSizes,
  updatePage,
} from '../paper.js';
import { loadFromFile } from '../loader.js';
import { activePhase, displayFileInfo } from '../utils.js';
import { toSvgPath } from '../parser/svg-presentation.js';
import { mm2px, px2mm } from '../../../math/svg.js';
import svgToLines from '../parser/svg-to-lines.js';
import plan from '../planner.js';

const { preview } = window;

pageSizes.forEach((pageSize) => {
  const option = document.createElement('option');
  option.value = pageSize.type;
  option.innerText = `${pageSize.type.toUpperCase()} (${pageSize.width}mm x ${
    pageSize.height
  }mm)`;
  preview['page-size'].append(option);
});

preview['page-size'].value = defaultPageSize.type;
preview['page-padding'].value = defaultPageSize.defaultPadding;
preview['page-fit'].checked = true;

preview['page-size'].addEventListener('change', (e) => {
  const pageSize = getPageSize(e.target.value);
  preview['page-padding'].value = pageSize.defaultPadding;
  updatePage();
});
preview['page-padding'].addEventListener('change', updatePage);
preview['page-fit'].addEventListener('change', updatePage);
preview['page-align-h'].addEventListener('change', updatePage);
preview['page-align-v'].addEventListener('change', updatePage);
preview['orientation-landscape'].addEventListener('change', updatePage);
preview['orientation-portrait'].addEventListener('change', updatePage);
preview['file-input'].addEventListener('change', async (e) => {
  const { files } = e.target;
  if (!files.length) return;
  const svg = files[0];
  const loaded = await loadFromFile(svg);
  displayFileInfo(loaded);
});
preview['file-btn'].addEventListener(
  'click',
  () => {
    preview['file-input'].click();
  },
  false,
);
preview['go-planning'].addEventListener('click', () => {
  activePhase('phase-planning');
  const imported = SVG('#imported');
  const lines = [...svgToLines(imported.node, { maxError: mm2px(0.1) })];
  imported.hide();
  const planner = SVG('#planner');
  // eslint-disable-next-line no-console
  console.log('lines: ', lines.length);
  const motions = plan(lines);
  planner.clear().show();
  planner.node.innerHTML = toSvgPath(motions);
  const path = planner.first();
  const length = path.length();
  const circle = planner.circle(mm2px(5));
  const distance = px2mm(length);
  const speed = 100; // mmps
  circle
    .animate((distance / speed) * 1000)
    .during((pos) => {
      const p = path.pointAt(pos * length);
      circle.center(p.x, p.y);
    })
    .loop(true);
});
