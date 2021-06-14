/* global SVG */
import plan from './svg-planner.js';
import { a4Height, a4Width, padding } from './paper.js';

export async function parseSVG(svg) {
  const content = SVG('#content');
  content.show().clear().svg(svg);
  const imported = content.first();
  imported
    .id('imported')
    .size(a4Width - padding * 2, a4Height - padding * 2)
    .move(padding, padding)
    .attr('preserveAspectRatio', 'xMidYMid meet');
  imported.viewbox(imported.bbox());
  await plan(imported);
  content.hide();
}

const app = document.getElementById('app');
app.addEventListener('dragover', (e) => {
  // this event is required to trigger following 'drop' event
  e.preventDefault();
});
app.addEventListener('drop', (e) => {
  // Prevent default behavior (Prevent file from being opened)
  e.preventDefault();
  // Handle the first file
  if (!e.dataTransfer.files.length) {
    return;
  }

  const file = e.dataTransfer.files[0];
  if (file.type !== 'image/svg+xml') {
    throw new Error('Invalid SVG Files');
  }

  const reader = new FileReader();
  reader.onload = async (ev) => {
    await parseSVG(ev.target.result);
    // eslint-disable-next-line no-console
    console.log('loaded');
  };
  reader.readAsText(file);
});

export default function load(path) {
  return fetch(path)
    .then((response) => response.text())
    .then(parseSVG);
}
