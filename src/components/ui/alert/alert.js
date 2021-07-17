import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './alert.css';

const Alert = ({ type = 'info', children, ...props }) => {
  return (
    <div className={classNames(styles.root, styles[type])} {...props}>
      {children}
    </div>
  );
};

Alert.propTypes = {
  type: PropTypes.oneOf(['info', 'warn', 'alert', 'success']),
  children: PropTypes.node.isRequired,
};

export default Alert;
