import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './button.css';

const Button = ({ variant = 'secondary', submit, children, ...props }, ref) => {
  return (
    <button
      className={classNames(styles.root, styles[variant])}
      type={submit ? 'submit' : 'button'}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary']),
  children: PropTypes.node.isRequired,
  submit: PropTypes.bool,
};

export default forwardRef(Button);
