/* global SVG */
import clean from './cleaner.js';
import { a4Height, a4Width, padding } from './paper.js';

export async function parseSVG(svg) {
  const loader = SVG('#loader');
  loader.show().clear().svg(svg);
  const imported = loader.first();
  imported
    .id('imported')
    .size(a4Width - padding * 2, a4Height - padding * 2)
    .move(padding, padding)
    .attr('preserveAspectRatio', 'xMidYMid meet');
  // const wrap = imported.group().id('wrap');
  // for (const el of imported.children()) {
  //   if (el !== wrap) {
  //     if (el.toParent) {
  //       el.toParent(wrap);
  //     } else {
  //       el.remove();
  //     }
  //   }
  // }
  // wrap.rotate(-90);
  imported.viewbox(imported.bbox());
  clean(imported);
  // loader.clear();
  // flatted.addTo('#canvas');
  // console.log('flatted');
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
