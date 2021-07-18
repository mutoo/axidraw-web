import React, { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import { px2mm } from 'math/svg';
import styles from './planning.css';
import PlotterContext from '../../context';
import { WORK_PHASE_PLANNING } from '../../presenters/work';

const Planning = observer(({ ...props }) => {
  const { work, page } = useContext(PlotterContext);

  return (
    <g
      className={classNames(
        styles.root,
        work.phase === WORK_PHASE_PLANNING ? 'block' : 'hidden',
      )}
      style={{ strokeWidth: px2mm(1) }}
      transform={page.pageToScreenMatrix.toString()}
      {...props}
    >
      <path d={work.linesAsPathDef} />
      <path
        style={{
          stroke: '#aaaaaa',
        }}
        d={work.connectionsAsPathDef}
      />
    </g>
  );
});

Planning.propTypes = {};

export default Planning;
