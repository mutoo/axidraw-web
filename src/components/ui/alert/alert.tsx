import classNames from 'clsx';
import React from 'react';
import styles from './alert.module.css';

const Alert = ({
  type = 'info',
  children,
  ...props
}: {
  type: 'info' | 'warn' | 'alert' | 'success',
  children: React.ReactNode,
}) => {
  return (
    <div className={classNames(styles.root, styles[type])} {...props}>
      {children}
    </div>
  );
};

export default Alert;
