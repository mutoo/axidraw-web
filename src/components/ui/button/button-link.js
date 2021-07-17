import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './button.css';

const ButtonLink = ({ variant, children, ...props }) => {
  return (
    <a className={classNames(styles.root, styles[variant])} {...props}>
      {children}
    </a>
  );
};

ButtonLink.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary']),
  children: PropTypes.node.isRequired,
};

export default ButtonLink;
