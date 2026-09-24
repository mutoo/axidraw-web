import { reaction } from 'mobx';
import { useEffect, useRef } from 'react';
import { aaSteps2xyDist } from '@/math/ebb';
import type { IVirtualPlotter } from '../plotter';
import { penPosition } from '../plotter/utils';
import styles from './canvas.module.css';

const Canvas = ({
  vm,
  width,
  height,
}: {
  vm: IVirtualPlotter;
  width: number;
  height: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const vmCtx = vm.context;
    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) {
      alert('Canvas not supported');
      return;
    }
    let prevX = 0;
    let prevY = 0;

    return reaction(
      () => penPosition(vmCtx),
      (position) => {
        const { x, y } = aaSteps2xyDist(position);
        canvasCtx.beginPath();
        if (vmCtx.pen === 0) {
          canvasCtx.lineWidth = 7;
          canvasCtx.lineCap = 'round';
          canvasCtx.moveTo(prevX, prevY);
          canvasCtx.lineTo(x * 10, y * 10);
          canvasCtx.stroke();
        }
        prevX = x * 10;
        prevY = y * 10;
      },
    );
  }, [vm]);
  return (
    <div className={styles.root}>
      <canvas
        width={width}
        height={height}
        className={styles.canvas}
        ref={canvasRef}
      />
      <div className={styles.vm} />
    </div>
  );
};

export default Canvas;
