/* global SVG */
import clean from './cleaner.js';
import { adjustPreview } from './paper.js';
import { displayFileInfo } from './utils.js';

export function parseSVG(svg) {
  const loader = SVG('#loader');
  loader.show().clear().svg(svg);
  const imported = loader.first();
  imported.id('imported').attr({
    'data-original-viewBox': imported.attr('viewBox'),
  });
  adjustPreview(imported);
  const counts = clean(imported);
  return { imported, counts };
}

export const loadFromFile = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseSVG(ev.target.result);
      resolve(parsed);
    };
    reader.readAsText(file);
  });
};

const app = document.getElementById('app');
app.addEventListener('dragover', (e) => {
  // this event is required to trigger following 'drop' event
  e.preventDefault();
});
app.addEventListener('drop', async (e) => {
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

  const loaded = await loadFromFile(file);
  displayFileInfo(loaded);
});

export default function load(path) {
  return fetch(path)
    .then((response) => response.text())
    .then(parseSVG);
}
