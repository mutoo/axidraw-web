import './paper.js';
import './phase/preview.js';
import './phase/planning.js';
import load from './loader.js';
import { displayFileInfo } from './utils.js';
import createPlotter from './plotter.js';
import { DEVICE_TYPE_USB } from '../../device/consts.js';

window.plotter = createPlotter(DEVICE_TYPE_USB);

async function main() {
  const loaded = await load('/assets/svg/test-shape.svg');
  displayFileInfo(loaded);
}

main();
