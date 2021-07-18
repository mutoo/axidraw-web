/* eslint-disable no-unused-vars */
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react-lite';
import { mm2px } from 'math/svg';
import Page from './page';
import styles from './workspace.css';
import ShadowDef from './shadow-def';
import Preview from './preview';
import PlotterContext from '../../context';

const Workspace = observer(({ margin = 20 }) => {
  const { work, page } = useContext(PlotterContext);
  const marginPx = mm2px(margin);
  const paddingPx = mm2px(page.padding);
  const widthPx = mm2px(page.width);
  const heightPx = mm2px(page.height);
  const { contentFitPage, contentPreserveAspectRatio } = page;
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
      <Page />
      <Preview />
    </svg>
  );
});

Workspace.propTypes = {
  margin: PropTypes.number,
};

export default Workspace;
