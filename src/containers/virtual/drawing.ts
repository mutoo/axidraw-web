import { compareStructural, reaction } from 'mobx';
import { aaSteps2xyDist } from '@/math/ebb';
import type { PageSize } from '@/plotter/page-sizes';
import type { VirtualPlotterContext } from './plotter';
import { PEN_DOWN, penPosition } from './plotter/utils';

export type PenStyle = {
  color: string;
  width: number; // mm
};

export type Stroke = PenStyle & {
  // x0, y0, x1, y1, ... in mm
  points: number[];
};

export type Drawing = ReturnType<typeof createDrawing>;

// what the pen has drawn on the paper
export const createDrawing = () => {
  let strokes: Stroke[] = [];
  // the stroke being drawn while the pen is down
  let current: Stroke | null = null;
  // goes up whenever strokes are taken off the paper, so that whatever shows
  // them knows to start over
  let generation = 0;
  const listeners = new Set<() => void>();
  const changed = () => {
    listeners.forEach((listener) => {
      listener();
    });
  };
  const lastPoint = ({ points }: Stroke) => [
    points[points.length - 2],
    points[points.length - 1],
  ];

  return {
    get strokes(): readonly Stroke[] {
      return strokes;
    },
    get generation() {
      return generation;
    },
    get isEmpty() {
      return strokes.length === 0;
    },
    penDown(x: number, y: number, style: PenStyle) {
      current = { ...style, points: [x, y] };
      strokes.push(current);
      changed();
    },
    lineTo(x: number, y: number) {
      if (!current) return;
      const [lastX, lastY] = lastPoint(current);
      if (x === lastX && y === lastY) return;
      current.points.push(x, y);
      changed();
    },
    penUp() {
      current = null;
    },
    // swap the pen: if it's down, the new one goes on from the same point
    setStyle(style: PenStyle) {
      if (
        !current ||
        (current.color === style.color && current.width === style.width)
      ) {
        return;
      }
      const [x, y] = lastPoint(current);
      current = { ...style, points: [x, y] };
      strokes.push(current);
      changed();
    },
    // take everything off the paper, and return it for restore()
    clear() {
      const removed = strokes;
      strokes = [];
      if (current) {
        // a pen that's down touches the clean paper where it is
        const [x, y] = lastPoint(current);
        current = {
          color: current.color,
          width: current.width,
          points: [x, y],
        };
        strokes.push(current);
      }
      generation += 1;
      changed();
      return removed;
    },
    // put what clear() took back, under whatever was drawn since
    restore(removed: readonly Stroke[]) {
      strokes = [...removed, ...strokes];
      generation += 1;
      changed();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

// trace the pen of the plotter onto the drawing, in the style of the pen in it
export const tracePen = (
  context: VirtualPlotterContext,
  drawing: Drawing,
  style: () => PenStyle,
) =>
  reaction(
    () => ({ pen: context.pen, ...penPosition(context) }),
    ({ pen, a1, a2 }, previous) => {
      const wasDown = previous?.pen === PEN_DOWN;
      if (pen !== PEN_DOWN) {
        if (wasDown) drawing.penUp();
        return;
      }
      const { x, y } = aaSteps2xyDist({ a1, a2 });
      if (wasDown) {
        drawing.lineTo(x, y);
      } else {
        drawing.penDown(x, y, style());
      }
    },
    { fireImmediately: true, equals: compareStructural },
  );

// draw a stroke on a canvas measured in mm, going on from its `from`th point
export const drawStroke = (
  ctx: CanvasRenderingContext2D,
  { color, width, points }: Stroke,
  from = 0,
) => {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (points.length === 2) {
    // the dot left where the pen went down
    ctx.beginPath();
    ctx.arc(points[0], points[1], width / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[from * 2], points[from * 2 + 1]);
  for (let i = (from + 1) * 2; i < points.length; i += 2) {
    ctx.lineTo(points[i], points[i + 1]);
  }
  ctx.stroke();
};

// draw a drawing onto a canvas measured in mm as it grows, a bit at a time
export const createDrawingRenderer = (
  ctx: CanvasRenderingContext2D,
  drawing: Drawing,
) => {
  let generation = -1;
  // the last stroke drawn, and how many of its points
  let stroke = 0;
  let points = 0;
  return {
    render() {
      const { strokes } = drawing;
      if (generation !== drawing.generation) {
        const { width, height } = ctx.canvas;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, width, height);
        ctx.restore();
        generation = drawing.generation;
        stroke = 0;
        points = 0;
      }
      for (let i = stroke; i < strokes.length; i += 1) {
        const drawn = i === stroke ? points : 0;
        const total = strokes[i].points.length / 2;
        if (drawn < total) {
          drawStroke(ctx, strokes[i], Math.max(drawn - 1, 0));
        }
        stroke = i;
        points = total;
      }
    },
  };
};

// the paper with its drawing as a picture, `scale` pixels to the mm
export const drawingToCanvas = (
  drawing: Drawing,
  paper: PageSize,
  scale: number,
) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(paper.width * scale);
  canvas.height = Math.round(paper.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported.');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(canvas.width / paper.width, canvas.height / paper.height);
  drawing.strokes.forEach((stroke) => {
    drawStroke(ctx, stroke);
  });
  return canvas;
};

const mm = (value: number) => String(Number(value.toFixed(3)));

// the drawing as an SVG the size of the paper, in mm
export const drawingToSVG = (
  strokes: readonly Stroke[],
  { width, height }: PageSize,
) => {
  const elements = strokes.map(({ color, width: penWidth, points }) => {
    const style = `stroke="${color}" stroke-width="${mm(penWidth)}"`;
    if (points.length === 2) {
      return `<path ${style} d="M${mm(points[0])} ${mm(points[1])}h0"/>`;
    }
    const coordinates: string[] = [];
    for (let i = 0; i < points.length; i += 2) {
      coordinates.push(`${mm(points[i])},${mm(points[i + 1])}`);
    }
    return `<polyline ${style} points="${coordinates.join(' ')}"/>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${mm(width)}mm" height="${mm(height)}mm" viewBox="0 0 ${mm(width)} ${mm(height)}">`,
    '<g fill="none" stroke-linecap="round" stroke-linejoin="round">',
    ...elements,
    '</g>',
    '</svg>',
    '',
  ].join('\n');
};
