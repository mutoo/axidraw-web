/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';
import Page from './page';
import styles from './workspace.css';
import { mm2px } from '../../../math/svg';
import { getHeight, getWidth } from '../utils/page';

export const ShadowDef = ({ margin }) => {
  const marginPx = mm2px(margin);
  return (
    <filter id="svgShadow">
      <feOffset
        id="svgOffset0"
        result="svgOffset0"
        in="SourceAlpha"
        dy="0"
        dx="0"
      />
      <feGaussianBlur
        id="svgBlur0"
        result="svgBlur0"
        in="svgOffset0"
        stdDeviation={`${marginPx / 4} ${marginPx / 4}`}
      />
      <feBlend
        id="svgBlend0"
        result="svgBlend0"
        in="SourceGraphic"
        in2="svgBlur0"
      />
    </filter>
  );
};

ShadowDef.propTypes = {
  margin: PropTypes.number,
};

const Workspace = ({
  pageSize,
  orientation,
  padding,
  margin,
  fitPage,
  alignmentHorizontal,
  alignmentVertical,
}) => {
  const marginPx = mm2px(margin);
  const widthPx = mm2px(getWidth(pageSize, orientation));
  const heightPx = mm2px(getHeight(pageSize, orientation));
  const viewBox = `${-marginPx} ${-marginPx} ${widthPx + marginPx * 2} ${
    heightPx + marginPx * 2
  }`;
  return (
    <svg
      className={styles.root}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      version="1.1"
    >
      <defs>
        <ShadowDef margin={margin} />
      </defs>
      <Page pageSize={pageSize} padding={padding} orientation={orientation} />
    </svg>
  );
};

Workspace.propTypes = {
  pageSize: PropTypes.object,
  orientation: PropTypes.oneOf(['landscape', 'portrait']),
  padding: PropTypes.number,
  margin: PropTypes.number,
  fitPage: PropTypes.bool,
  alignmentHorizontal: PropTypes.oneOf(['left', 'center', 'right']),
  alignmentVertical: PropTypes.oneOf(['top', 'center', 'bottom']),
};

export default Workspace;
