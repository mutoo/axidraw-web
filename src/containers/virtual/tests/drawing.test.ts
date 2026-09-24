import { runInAction } from 'mobx';
import { describe, expect, it } from 'vitest';
import { xyDist2aaSteps } from '@/math/ebb';
import { findPageSize } from '@/plotter/page-sizes';
import {
  createDrawing,
  createDrawingRenderer,
  drawingToSVG,
  tracePen,
} from '../drawing';
import type { PenStyle } from '../drawing';
import { createVMContext } from '../plotter';
import { movePenByHand, PEN_DOWN, PEN_UP } from '../plotter/utils';

const black: PenStyle = { color: '#000000', width: 0.5 };
const red: PenStyle = { color: '#dc2626', width: 1 };

// put the pen at x, y mm without turning the motors
const moveTo = (
  context: ReturnType<typeof createVMContext>,
  x: number,
  y: number,
) => {
  runInAction(() => {
    movePenByHand(context, xyDist2aaSteps({ x, y }));
  });
};

const setPen = (context: ReturnType<typeof createVMContext>, pen: number) => {
  runInAction(() => {
    context.pen = pen;
  });
};

// the points of each stroke, to 0.1 mm
const traced = (strokes: readonly { points: number[] }[]) =>
  strokes.map(({ points }) => points.map((p) => Math.round(p * 10) / 10));

describe('drawing', () => {
  it('traces the pen while it is down', () => {
    const context = createVMContext('2.7.0');
    const drawing = createDrawing();
    let style = black;
    const dispose = tracePen(context, drawing, () => style);

    moveTo(context, 10, 10);
    setPen(context, PEN_DOWN);
    moveTo(context, 20, 10);
    moveTo(context, 20, 20);
    setPen(context, PEN_UP);
    moveTo(context, 50, 50);
    style = red;
    setPen(context, PEN_DOWN);
    setPen(context, PEN_UP);
    dispose();

    expect(traced(drawing.strokes)).toEqual([
      [10, 10, 20, 10, 20, 20],
      // a dot where the pen went down and up
      [50, 50],
    ]);
    expect(drawing.strokes.map(({ color }) => color)).toEqual([
      black.color,
      red.color,
    ]);
  });

  it('goes on in the new style from the same point when the pen changes', () => {
    const drawing = createDrawing();
    drawing.penDown(0, 0, black);
    drawing.lineTo(10, 0);
    drawing.setStyle(red);
    drawing.lineTo(10, 10);
    expect(drawing.strokes).toEqual([
      { ...black, points: [0, 0, 10, 0] },
      { ...red, points: [10, 0, 10, 10] },
    ]);
  });

  it('keeps drawing on the clean paper if the pen is down when cleared', () => {
    const drawing = createDrawing();
    drawing.penDown(0, 0, black);
    drawing.lineTo(10, 0);
    const { generation } = drawing;
    const removed = drawing.clear();
    expect(drawing.generation).not.toBe(generation);
    drawing.lineTo(10, 10);
    expect(removed).toEqual([{ ...black, points: [0, 0, 10, 0] }]);
    expect(drawing.strokes).toEqual([{ ...black, points: [10, 0, 10, 10] }]);

    // what was cleared goes back under what has been drawn since
    drawing.restore(removed);
    expect(traced(drawing.strokes)).toEqual([
      [0, 0, 10, 0],
      [10, 0, 10, 10],
    ]);
  });

  it('tells whoever draws it about every change', () => {
    const drawing = createDrawing();
    let changes = 0;
    const unsubscribe = drawing.subscribe(() => {
      changes += 1;
    });
    drawing.penDown(0, 0, black);
    drawing.lineTo(1, 1);
    // no change, no news
    drawing.lineTo(1, 1);
    drawing.clear();
    unsubscribe();
    drawing.penDown(2, 2, black);
    expect(changes).toBe(3);
  });

  it('saves as an SVG the size of the paper, in mm', () => {
    const drawing = createDrawing();
    drawing.penDown(10, 20.12345, black);
    drawing.lineTo(30, 40);
    drawing.penUp();
    drawing.penDown(5, 5, red);
    drawing.penUp();
    expect(drawingToSVG(drawing.strokes, findPageSize('a5'))).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="148mm" viewBox="0 0 210 148">',
        '<g fill="none" stroke-linecap="round" stroke-linejoin="round">',
        '<polyline stroke="#000000" stroke-width="0.5" points="10,20.123 30,40"/>',
        '<path stroke="#dc2626" stroke-width="1" d="M5 5h0"/>',
        '</g>',
        '</svg>',
        '',
      ].join('\n'),
    );
  });
});

describe('drawing renderer', () => {
  // records the points of each path it strokes, and every clear
  const createContext = () => {
    const calls: string[] = [];
    let path: string[] = [];
    const ctx = {
      canvas: { width: 100, height: 100 },
      save() {},
      restore() {},
      setTransform() {},
      clearRect() {
        calls.push('clear');
      },
      beginPath() {
        path = [];
      },
      moveTo(x: number, y: number) {
        path.push(`${x},${y}`);
      },
      lineTo(x: number, y: number) {
        path.push(`${x},${y}`);
      },
      arc(x: number, y: number) {
        path.push(`dot ${x},${y}`);
      },
      stroke() {
        calls.push(path.join(' '));
      },
      fill() {
        calls.push(path.join(' '));
      },
    };
    return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
  };

  it('draws only what is new, and starts over after a clear', () => {
    const { ctx, calls } = createContext();
    const drawing = createDrawing();
    const renderer = createDrawingRenderer(ctx, drawing);
    drawing.penDown(0, 0, black);
    renderer.render();
    drawing.lineTo(1, 0);
    drawing.lineTo(2, 0);
    renderer.render();
    drawing.setStyle(red);
    drawing.lineTo(2, 1);
    renderer.render();
    renderer.render();
    drawing.penUp();
    drawing.clear();
    drawing.penDown(5, 5, black);
    renderer.render();
    expect(calls).toEqual([
      'clear',
      'dot 0,0',
      '0,0 1,0 2,0',
      '2,0 2,1',
      'clear',
      'dot 5,5',
    ]);
  });
});
