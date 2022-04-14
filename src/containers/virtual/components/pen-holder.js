import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { reaction } from 'mobx';
import classNames from 'classnames';
import Carriage from 'assets/svg/pen-holder.svg';
import styles from './pen-holder.css';
import { aaSteps2xyDist } from '../../../math/ebb';

const PenHolder = ({ vm }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [pen, setPen] = useState(1);
  useEffect(() => {
    if (!vm) return () => {};
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
      <img className={styles.carriage} src={Carriage} />
    </div>
  );
};

PenHolder.propTypes = {
  vm: PropTypes.object.isRequired,
};

export default PenHolder;
