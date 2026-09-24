import { useEffect, useRef } from 'react';
import type { PageSize } from '@/plotter/page-sizes';
import type { Drawing } from '../drawing';
import { createDrawingRenderer } from '../drawing';
import styles from './canvas.module.css';

// the drawing on the paper, drawn sharp at the size it's shown
const Canvas = ({
  drawing,
  paper,
  scale,
}: {
  drawing: Drawing;
  paper: PageSize;
  // pixels to the mm
  scale: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(paper.width * scale * ratio);
    canvas.height = Math.round(paper.height * scale * ratio);
    ctx.setTransform(
      canvas.width / paper.width,
      0,
      0,
      canvas.height / paper.height,
      0,
      0,
    );
    const renderer = createDrawingRenderer(ctx, drawing);
    renderer.render();
    // the pen moves many times a frame: draw what's new once per frame
    let frame = 0;
    const unsubscribe = drawing.subscribe(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        renderer.render();
      });
    });
    return () => {
      unsubscribe();
      cancelAnimationFrame(frame);
    };
  }, [drawing, paper, scale]);

  return <canvas className={styles.canvas} ref={canvasRef} />;
};

export default Canvas;
