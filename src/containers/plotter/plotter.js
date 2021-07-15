import React from 'react';
import Workspace from './components/workspace';
import { defaultPageSize } from './consts/page-sizes';
// import PropTypes from 'prop-types';
import styles from './plotter.css';

const Plotter = () => {
  return (
    <div className={styles.workspace}>
      <Workspace
        pageSize={defaultPageSize}
        margin={20}
        padding={defaultPageSize.defaultPadding}
        alignmentHorizontal="center"
        alignmentVertical="center"
        orientation="landscape"
        fitPage
      />
    </div>
  );
};

Plotter.propTypes = {};

export default Plotter;
