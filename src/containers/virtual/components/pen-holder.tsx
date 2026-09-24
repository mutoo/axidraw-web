import classNames from 'clsx';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import type { PointerEvent, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import Carriage from '@/assets/svg/pen-holder.svg';
import { HIGH_DPI_XY } from '@/communication/ebb/constants';
import { aaSteps2xyDist, xy2aa } from '@/math/ebb';
import type { PageSize } from '@/plotter/page-sizes';
import type { IVirtualPlotter } from '../plotter';
import { isFreeMode, PEN_DOWN, penPosition } from '../plotter/utils';
import styles from './pen-holder.module.css';

// the size of the carriage artwork, whose bottom left corner is the pen tip
const CARRIAGE_WIDTH = 71.279; // mm
const CARRIAGE_HEIGHT = 332.19; // mm

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// 1/16 steps to the mm
const STEPS_PER_MM = HIGH_DPI_XY / 25.4;

// push the carriage by hand to x, y mm on the paper, if it's free to move,
// to the nearest step so that nudges add up
const pushCarriage = (
  vm: IVirtualPlotter,
  paper: PageSize,
  x: number,
  y: number,
) =>
  vm.moveByHand(
    xy2aa({
      x: Math.round(clamp(x, 0, paper.width) * STEPS_PER_MM),
      y: Math.round(clamp(y, 0, paper.height) * STEPS_PER_MM),
    }),
  );

// how far an arrow key pushes the carriage, in mm
const NUDGE = 1;
const NUDGE_FAR = 10;
const nudges: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

const PenHolder = observer(
  ({
    vm,
    paper,
    scale,
    paperRef,
  }: {
    vm: IVirtualPlotter;
    paper: PageSize;
    // pixels to the mm
    scale: number;
    // the paper, which the pen's position is measured from
    paperRef: RefObject<HTMLDivElement | null>;
  }) => {
    const { context } = vm;
    const { x, y } = aaSteps2xyDist(penPosition(context));
    const free = isFreeMode(context);
    const penDown = context.pen === PEN_DOWN;
    // where the carriage was grabbed, from the pen tip, in mm
    const grabRef = useRef<{ dx: number; dy: number } | null>(null);
    const [pushing, setPushing] = useState(false);

    // the pointer, in mm from the top left corner of the paper
    const pointerOnPaper = (e: PointerEvent) => {
      const rect = paperRef.current?.getBoundingClientRect();
      if (!rect) return null;
      return {
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale,
      };
    };

    // a command takes the carriage back for good: letting go ends the push
    useEffect(
      () =>
        reaction(
          () => isFreeMode(vm.context),
          (isFree) => {
            if (isFree) return;
            grabRef.current = null;
            setPushing(false);
          },
        ),
      [vm],
    );

    // the arrow keys push the carriage a little
    useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        const nudge = nudges[e.key] as [number, number] | undefined;
        if (!nudge || e.defaultPrevented || e.altKey || e.metaKey) return;
        // leave the keys to the controls that use them
        if (
          e.target instanceof HTMLElement &&
          e.target.closest('select, input')
        ) {
          return;
        }
        if (!isFreeMode(vm.context)) return;
        e.preventDefault();
        const step = e.shiftKey ? NUDGE_FAR : NUDGE;
        const pen = aaSteps2xyDist(penPosition(vm.context));
        pushCarriage(
          vm,
          paper,
          pen.x + nudge[0] * step,
          pen.y + nudge[1] * step,
        );
      };
      window.addEventListener('keydown', onKeyDown);
      return () => {
        window.removeEventListener('keydown', onKeyDown);
      };
    }, [vm, paper]);

    const release = (e: PointerEvent<HTMLDivElement>) => {
      grabRef.current = null;
      setPushing(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    };

    return (
      <div
        className={classNames(styles.root, {
          [styles.free]: free,
          [styles.pushing]: pushing,
        })}
        style={{ transform: `translate(${x * scale}px, ${y * scale}px)` }}
        title={
          free
            ? 'Drag it, or press the arrow keys, to move the carriage by hand'
            : penDown
              ? 'Raise the pen to move the carriage by hand'
              : 'The carriage can be moved by hand when no command has come in for a few seconds'
        }
        onPointerDown={(e) => {
          if (e.button !== 0 || !free) return;
          const pointer = pointerOnPaper(e);
          if (!pointer) return;
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          grabRef.current = { dx: pointer.x - x, dy: pointer.y - y };
          setPushing(true);
        }}
        onPointerMove={(e) => {
          if (!grabRef.current) return;
          const pointer = pointerOnPaper(e);
          if (!pointer) return;
          pushCarriage(
            vm,
            paper,
            pointer.x - grabRef.current.dx,
            pointer.y - grabRef.current.dy,
          );
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
      >
        <img
          className={styles.carriage}
          style={{
            width: CARRIAGE_WIDTH * scale,
            height: CARRIAGE_HEIGHT * scale,
          }}
          src={Carriage}
          alt="pen holder"
          draggable={false}
        />
        <span className={classNames(styles.pen, penDown && styles.penDown)} />
      </div>
    );
  },
);

export default PenHolder;
