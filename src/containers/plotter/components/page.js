import React from 'react';
import PropTypes from 'prop-types';
import { mm2px } from 'math/svg';
import { observer } from 'mobx-react-lite';
import Gizmo from './gizmo';
import styles from './page.css';

const Page = observer(({ page }) => {
  const widthPx = mm2px(page.width);
  const heightPx = mm2px(page.height);
  const paddingPx = mm2px(page.padding);
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
      <Gizmo page={page} />
    </g>
  );
});

Page.propTypes = {
  page: PropTypes.object,
};

export default Page;
