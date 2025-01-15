import classNames from 'clsx';
import { forwardRef } from 'react';
import styles from './button.module.css';

const Button = (
  {
    variant = 'secondary',
    onClick,
    submit,
    children,
    disabled,
    ...props
  }: {
    children?: React.ReactNode;
    variant?: 'primary' | 'secondary';

    disabled?: boolean;
  } & (
    | {
        onClick: () => void;
        submit?: boolean;
      }
    | {
        submit: boolean;
        onClick?: () => void;
      }
  ),
  ref: React.ForwardedRef<HTMLButtonElement>,
) => {
  return (
    <button
      className={classNames(styles.root, styles[variant])}
      type={submit ? 'submit' : 'button'}
      disabled={disabled}
      ref={ref}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default forwardRef(Button);
