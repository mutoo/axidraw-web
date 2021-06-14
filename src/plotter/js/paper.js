/* global SVG */
import { mm2px } from '../../math/svg.js';

const margin = mm2px(10);
const a4Width = mm2px(297);
const a4height = mm2px(210);
const canvas = SVG()
  .id('canvas')
  .attr('preserveAspectRatio', 'xMidYMid meet')
  .viewbox(-margin, -margin, a4Width + margin * 2, a4height + margin * 2)
  .addTo('#app');

const page = canvas.group().id('page');
page
  .rect(a4Width, a4height)
  .attr({ fill: 'rgba(0,0,0,0.25)' })
  .filterWith((add) => {
    const blur = add
      .offset(0, 0)
      .in(add.$sourceAlpha)
      .gaussianBlur(margin / 2);
    add.blend(add.$source, blur);
  });
page.rect(a4Width, a4height).attr({ fill: 'white' });

canvas.group().id('content');
canvas.group().id('planning');
