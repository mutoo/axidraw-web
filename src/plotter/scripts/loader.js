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
  const { counts, svgEls } = clean(imported);
  return { counts, svgEls };
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
const pageArea = document.getElementById('page-area');

// this event is required to trigger following 'drop' event
pageArea.addEventListener('dragover', (e) => {
  e.preventDefault();
});

pageArea.addEventListener('dragenter', (e) => {
  e.preventDefault();
  app.classList.add('aw-file-dropping');
});

pageArea.addEventListener('dragleave', (e) => {
  e.preventDefault();
  app.classList.remove('aw-file-dropping');
});

pageArea.addEventListener('drop', async (e) => {
  e.preventDefault();
  app.classList.remove('aw-file-dropping');
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
