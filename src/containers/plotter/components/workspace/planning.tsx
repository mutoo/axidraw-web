import classNames from 'clsx';
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { px2mm } from '@/math/svg';
import { PlotterContext } from '../../context';
import { PLANNING_PHASE } from '../../presenters/planning';
import styles from './planning.module.css';

const Planning = observer(
  ({ strokeWidth, ...props }: { strokeWidth: number }) => {
    const { planning, page } = useContext(PlotterContext);
    const scale = px2mm(1);
    return (
      <g
        className={classNames(
          styles.root,
          planning.phase === PLANNING_PHASE.PLANNING ||
            planning.phase === PLANNING_PHASE.PLOTTING
            ? 'block'
            : 'hidden',
        )}
        style={
          {
            '--planning-stroke-width': `${strokeWidth * scale}%`,
          } as React.CSSProperties
        }
        transform={page.pageToScreenMatrix.toString()}
        {...props}
      >
        <path
          className={styles.motionPenUp}
          d={planning.connectionsAsPathDef}
        />
        <path className={styles.motionPenDown} d={planning.linesAsPathDef} />
      </g>
    );
  },
);

export default Planning;
