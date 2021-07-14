import React from 'react';
import PropTypes from 'prop-types';
import { mm2px } from 'math/svg';
import Gizmo from './gizmo';
import { getHeight, getWidth } from '../utils/page';

const Page = ({ pageSize, orientation, padding }) => {
  const widthPx = mm2px(getWidth(pageSize, orientation));
  const heightPx = mm2px(getHeight(pageSize, orientation));
  const paddingPx = mm2px(padding);
  return (
    <g id="page">
      <rect
        id="page-shadow"
        width={widthPx}
        height={heightPx}
        fill="rgba(0,0,0,0.25)"
        filter="url(#svgShadow)"
      />
      <rect
        id="page-area"
        fill="rgb(255, 255, 255)"
        width={widthPx}
        height={heightPx}
      />
      <rect
        id="page-printable"
        width={widthPx - paddingPx * 2}
        height={heightPx - paddingPx * 2}
        x={paddingPx}
        y={paddingPx}
        fill="none"
        stroke="#b8b8b8"
        strokeWidth="1"
        strokeDasharray="5,5"
      />
      <Gizmo pageSize={pageSize} orientation={orientation} />
    </g>
  );
};

Page.propTypes = {
  pageSize: PropTypes.object,
  orientation: PropTypes.oneOf(['landscape', 'portrait']),
  padding: PropTypes.number,
};

export default Page;
