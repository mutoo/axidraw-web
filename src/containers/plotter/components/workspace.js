/* eslint-disable no-unused-vars */
import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react-lite';
import Page from './page';
import styles from './workspace.css';
import { mm2px } from '../../../math/svg';

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

const Workspace = observer(({ margin, page }) => {
  const marginPx = mm2px(margin);
  const widthPx = mm2px(page.width);
  const heightPx = mm2px(page.height);
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
      <Page page={page} />
    </svg>
  );
});

Workspace.propTypes = {
  margin: PropTypes.number,
  page: PropTypes.object,
};

export default Workspace;
