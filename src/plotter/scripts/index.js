import './paper.js';
import './preview.js';
import load from './loader.js';
import { displayFileInfo } from './utils.js';

async function main() {
  const loaded = await load('/assets/svg/axidraw-first.svg');
  displayFileInfo(loaded);
  // eslint-disable-next-line no-console
  console.log('loaded');
}

main();
