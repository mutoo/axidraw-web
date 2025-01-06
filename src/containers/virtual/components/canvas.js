import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { reaction } from 'mobx';
import styles from './canvas.css';
import { aaSteps2xyDist } from '../../../math/ebb';

const Canvas = ({ vm, width, height }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!vm) return () => {};
    const vmCtx = vm.context;
    const canvasCtx = canvasRef.current.getContext('2d');
    let prevX = 0;
    let prevY = 0;

    return reaction(
      () => [vmCtx.motor.a1, vmCtx.motor.a2],
      ([a1, a2]) => {
        const { x, y } = aaSteps2xyDist({ a1, a2 }, vmCtx.motor.m1);
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

Canvas.propTypes = {
  vm: PropTypes.object.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default Canvas;
