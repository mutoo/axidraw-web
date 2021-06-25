import './paper.js';
import './phase/preview.js';
import './phase/planning.js';
import load from './loader.js';
import { displayFileInfo } from './utils.js';

async function main() {
  const loaded = await load('/assets/svg/test-shape.svg');
  displayFileInfo(loaded);
}

main();
