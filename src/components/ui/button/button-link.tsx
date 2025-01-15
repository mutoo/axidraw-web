import classNames from 'clsx';
import React from 'react';
import styles from './button.module.css';

const ButtonLink = ({
  variant,
  children,
  ...props
}: {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
}) => {
  return (
    <a className={classNames(styles.root, styles[variant])} {...props}>
      {children}
    </a>
  );
};

export default ButtonLink;
