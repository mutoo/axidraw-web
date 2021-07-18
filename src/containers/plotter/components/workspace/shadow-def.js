import React from 'react';
import PropTypes from 'prop-types';
import { mm2px } from 'math/svg';

const ShadowDef = ({ margin }) => {
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

export default ShadowDef;
