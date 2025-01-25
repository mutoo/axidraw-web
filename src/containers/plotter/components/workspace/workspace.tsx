import { observer } from 'mobx-react-lite';
import { useContext, useLayoutEffect, useRef, useState } from 'react';
import { mm2px, normalizedDiagonalLength } from '@/math/svg';
import { PlotterContext } from '../../context';
import Gizmo from './gizmo';
import Page from './page';
import Planning from './planning';
import Setup from './setup';
import ShadowDef from './shadow-def';
import styles from './workspace.module.css';

const Workspace = observer(({ margin = 20 }: { margin?: number }) => {
  const { page, planning } = useContext(PlotterContext);
  const marginPx = mm2px(margin);
  const widthPx = mm2px(page.width);
  const heightPx = mm2px(page.height);
  const viewBox = `${-marginPx} ${-marginPx} ${widthPx + marginPx * 2} ${
    heightPx + marginPx * 2
  }`;
  const svgRef = useRef<SVGSVGElement>(null);
  const [strokeWidth, setStrokeWidth] = useState(1);
  useLayoutEffect(() => {
    if (!svgRef.current) return;
    setStrokeWidth(
      (mm2px(planning.previewStrokeWidth) /
        normalizedDiagonalLength(svgRef.current.viewBox)) *
        100,
    );
  }, [viewBox, planning.previewStrokeWidth]);
  return (
    <svg
      className={styles.root}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      version="1.1"
      ref={svgRef}
    >
      <defs>
        <ShadowDef margin={margin} />
      </defs>
      <Page />
      <Setup />
      <Planning strokeWidth={strokeWidth} />
      <Gizmo />
    </svg>
  );
});

export default Workspace;
