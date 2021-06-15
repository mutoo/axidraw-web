/* global SVG */
import { mm2px } from '../../math/svg.js';

export const a4Width = mm2px(297);
export const a4Height = mm2px(210);
export const margin = mm2px(10);
export const padding = mm2px(20);

const canvas = SVG()
  .id('canvas')
  .attr('preserveAspectRatio', 'xMidYMid meet')
  .viewbox(-margin, -margin, a4Width + margin * 2, a4Height + margin * 2)
  .addTo('#app');

const page = canvas.group().id('page');
page
  .rect(a4Width, a4Height)
  .attr({ fill: 'rgba(0,0,0,0.25)' })
  // drop shadow
  .filterWith((add) => {
    const blur = add
      .offset(0, 0)
      .in(add.$sourceAlpha)
      .gaussianBlur(margin / 2);
    add.blend(add.$source, blur);
  });
page.rect(a4Width, a4Height).attr({ fill: 'white' });

page
  .rect(a4Width - padding * 2, a4Height - padding * 2)
  .move(padding, padding)
  .attr({
    fill: 'none',
    stroke: '#333',
    'stroke-width': '0.1mm',
    'stroke-dasharray': '5,5',
  });

canvas.group().id('loader');
