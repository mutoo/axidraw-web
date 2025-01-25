import classNames from 'clsx';
import { reaction } from 'mobx';
import { useEffect, useState } from 'react';
import Carriage from '@/assets/svg/pen-holder.svg';
import { aaSteps2xyDist } from '../../../math/ebb';
import { IVirtualPlotter } from '../plotter';
import styles from './pen-holder.module.css';

const PenHolder = ({ vm }: { vm: IVirtualPlotter }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [pen, setPen] = useState(1);
  useEffect(() => {
    const vmCtx = vm.context;
    const posDisposer = reaction(
      () => [vmCtx.motor.a1, vmCtx.motor.a2],
      ([a1, a2]) => {
        const { x, y } = aaSteps2xyDist({ a1, a2 }, vmCtx.motor.m1);
        setPos({ x: x * 10, y: y * 10 });
      },
    );
    const penDisposer = reaction(
      () => vmCtx.pen,
      (penState) => {
        setPen(penState);
      },
    );
    return () => {
      posDisposer();
      penDisposer();
    };
  }, [vm]);
  return (
    <div
      className={styles.root}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
    >
      <span className={classNames(styles.dot, pen && styles.dotUp)} />
      <img
        className={classNames(styles.carriage, {
          [styles.carriageHidden]: pos.x === 0 && pos.y === 0,
        })}
        src={Carriage}
        alt="pen holder"
      />
    </div>
  );
};

export default PenHolder;
