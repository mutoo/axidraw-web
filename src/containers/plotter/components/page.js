import React from 'react';
import PropTypes from 'prop-types';
import { mm2px } from 'math/svg';
import { getHeight, getWidth } from '../utils/page';
import Gizmo from './gizmo';
import styles from './page.css';

const Page = ({ pageSize, orientation, padding }) => {
  const widthPx = mm2px(getWidth(pageSize, orientation));
  const heightPx = mm2px(getHeight(pageSize, orientation));
  const paddingPx = mm2px(padding);
  return (
    <g>
      <rect
        className={styles.shadow}
        width={widthPx}
        height={heightPx}
        filter="url(#svgShadow)"
      />
      <rect className={styles.paper} width={widthPx} height={heightPx} />
      <rect
        className={styles.printable}
        width={widthPx - paddingPx * 2}
        height={heightPx - paddingPx * 2}
        x={paddingPx}
        y={paddingPx}
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
