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
import { createScreenToPaperMatrix, mm2px } from '../../../math/svg.js';
import svgToLines from '../parser/svg-to-lines.js';
import plan from '../planner.js';
import { transformPoint } from '../parser/svg-math.js';

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
  const pageSize = getPageSize(preview['page-size'].value) || defaultPageSize;
  const screenToPaperMatrix = createScreenToPaperMatrix(
    preview.orientation.value,
    pageSize,
  );
  const screenToPaperMatrixInv = screenToPaperMatrix.inverse();
  const motions = plan(lines, {
    screenToPaperMatrix,
    origin:
      preview.orientation.value === 'landscape'
        ? [0, 0]
        : [mm2px(pageSize.height), 0],
  });
  window.plotter.upload(motions);
  planner.clear().show();
  planner.node.innerHTML = toSvgPath(motions);
  const path = planner.first();
  path.transform(screenToPaperMatrixInv);
  const length = path.length();
  const circle = planner.circle(mm2px(5));
  const distance = length;
  const speed = 100; // mmps
  circle
    .animate((distance / speed) * 1000)
    .during((pos) => {
      const p = path.pointAt(pos * length);
      const tp = transformPoint(p.x, p.y, screenToPaperMatrixInv);
      circle.center(tp.x, tp.y);
    })
    .loop(true);
});
