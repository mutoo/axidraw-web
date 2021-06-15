import './paper.js';
import load from './loader.js';

async function main() {
  await load('/assets/svg/axidraw-first.svg');
  // eslint-disable-next-line no-console
  console.log('loaded');
}

main();
