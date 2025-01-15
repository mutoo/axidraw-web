import classNames from 'clsx';
import styles from './panel.module.css';

const Panel = ({
  active,
  children,
  ...props
}: {
  active: boolean;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={classNames(styles.root, active ? styles.active : '')}
      {...props}
    >
      {children}
    </div>
  );
};

export default Panel;
