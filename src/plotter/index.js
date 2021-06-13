let content = null;

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
    content.clear();
    content.svg(ev.target.result);
    const imported = content.first();
    imported.size('250mm', '170mm').move('20mm', '20mm');
  };
  reader.readAsText(file);
});

/* global SVG */
const margin = (96 / 2.54) * 2;
const a4Width = (96 / 2.54) * 29;
const a4height = (96 / 2.54) * 21;
const canvas = SVG()
  .id('canvas')
  .attr('preserveAspectRatio', 'xMidYMid meet')
  .viewbox(-margin, -margin, a4Width + margin * 2, a4height + margin * 2)
  .addTo('#app');

canvas
  .group()
  .id('page')
  .rect('290mm', '210mm')
  .attr({ fill: 'transparent', stroke: '#c7c7c7' });

content = canvas.group().id('content');
