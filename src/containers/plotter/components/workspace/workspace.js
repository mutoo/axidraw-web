/* eslint-disable no-unused-vars */
import React, { useContext, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react-lite';
import { mm2px, normalizedDiagonalLength } from 'math/svg';
import PlotterContext from '../../context';
import Page from './page';
import styles from './workspace.css';
import ShadowDef from './shadow-def';
import Setup from './setup';
import Planning from './planning';
import Gizmo from './gizmo';
import Debug from './debug';

const Workspace = observer(({ margin = 20 }) => {
  const { page, planning } = useContext(PlotterContext);
  const marginPx = mm2px(margin);
  const widthPx = mm2px(page.width);
  const heightPx = mm2px(page.height);
  const viewBox = `${-marginPx} ${-marginPx} ${widthPx + marginPx * 2} ${
    heightPx + marginPx * 2
  }`;
  const svgRef = useRef(null);
  const [strokeWidth, setStrokeWidth] = useState(1);
  useLayoutEffect(() => {
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
      <Debug debugRtree={true} />
      <Gizmo />
    </svg>
  );
});

Workspace.propTypes = {
  margin: PropTypes.number,
};

export default Workspace;
