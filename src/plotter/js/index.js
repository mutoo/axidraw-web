import './paper.js';
import load from './svg-loader.js';

async function main() {
  await load('/assets/svg/axidraw-first.svg');
  // eslint-disable-next-line no-console
  console.log('loaded');
}

main();
