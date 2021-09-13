import React, { useContext, useEffect, useRef, useState } from 'react';
import Alert from 'components/ui/alert/alert';
import { observer } from 'mobx-react-lite';
import { formatTime } from 'utils/time';
import PlotterContext from '../../context';

const Estimating = observer(() => {
  const { work, planning } = useContext(PlotterContext);
  const [time, setTime] = useState(
    work.estimate({ motions: planning.motions }),
  );
  const timer = useRef();
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setTime(work.estimate({ motions: planning.motions }));
    }, 100);
    return () => {
      clearTimeout(timer.current);
    };
  });
  if (!time) return null;
  return (
    <section className="grid grid-cols-1 gap-4">
      <Alert type="info">
        Estimated total plotting time: {formatTime(time / 1000)}
      </Alert>
    </section>
  );
});

Estimating.propTypes = {};

export default Estimating;
