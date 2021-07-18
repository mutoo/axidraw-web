import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './panel.css';

const Panel = ({ active, children, ...props }) => {
  return (
    <div
      className={classNames(styles.root, active ? styles.active : '')}
      {...props}
    >
      {children}
    </div>
  );
};

Panel.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.node,
};

export default Panel;
