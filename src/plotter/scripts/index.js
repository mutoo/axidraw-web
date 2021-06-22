import './paper.js';
import './preview.js';
import './planning.js';
import load from './loader.js';
import { displayFileInfo } from './utils.js';

async function main() {
  const loaded = await load('/assets/svg/test-arc.svg');
  displayFileInfo(loaded);
}

main();
