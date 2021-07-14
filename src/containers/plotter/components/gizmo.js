import React from 'react';
import PropTypes from 'prop-types';
import { mm2px } from 'math/svg';
import { getWidth } from '../utils/page';

const Gizmo = ({ pageSize, orientation }) => {
  return (
    <g
      id="gizmo"
      fill="none"
      transform={
        orientation === 'portrait'
          ? `translate(${mm2px(getWidth(pageSize, orientation))},0) rotate(90) `
          : null
      }
    >
      <polyline
        points={`0,0 ${mm2px(10)},0 ${mm2px(8)},${mm2px(-2)}`}
        strokeWidth="1mm"
        stroke="#ff0000"
      />
      <polyline
        points={`0,0 0,${mm2px(10)} ${mm2px(-2)},${mm2px(8)}`}
        strokeWidth="1mm"
        stroke="#00ff00"
      />
      <circle r={mm2px(3)} cx="0" cy="0" fill="#0000ff" />
    </g>
  );
};

Gizmo.propTypes = {
  pageSize: PropTypes.object,
  orientation: PropTypes.oneOf(['landscape', 'portrait']),
};

export default Gizmo;
