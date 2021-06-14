/* global SVG */
import { mm2px } from '../../math/svg.js';

export function setContent(svg) {
  const content = SVG('#content');
  content.clear();
  content.svg(svg);
  const imported = content.first();
  imported
    .id('imported')
    .size(mm2px(257), mm2px(170))
    .move(mm2px(20), mm2px(20))
    .attr('preserveAspectRatio', 'xMidYMid meet');
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
  reader.onload = (ev) => {
    setContent(ev.target.result);
  };
  reader.readAsText(file);
});

export default function load(path) {
  fetch(path)
    .then((response) => response.text())
    .then(setContent);
}
