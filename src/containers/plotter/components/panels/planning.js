import React, { useContext, useLayoutEffect, useRef, useState } from 'react';
import Button from 'components/ui/button/button';
import Alert from 'components/ui/alert/alert';
import { observer } from 'mobx-react-lite';
import PlotterContext from '../../context';
import { WORK_PHASE_PLANNING, WORK_PHASE_PREVIEW } from '../../presenters/work';
import Panel from './panel';
import styles from './planning.css';

const Planning = observer(({ ...props }) => {
  const { work, page } = useContext(PlotterContext);
  const [connectedError, setConnectedError] = useState(0.2);
  const planningButtonRef = useRef(null);
  useLayoutEffect(() => {
    // when switch to planning phase, extract svg to lines.
    if (work.phase === WORK_PHASE_PLANNING) {
      // manually trigger a planning
      planningButtonRef.current.click();
    }
  }, [work.phase]);
  return (
    <Panel active={work.phase === WORK_PHASE_PLANNING} {...props}>
      <section>
        <h3>Planning</h3>
        <p className="mb-4">
          In this phase, the SVG would be transformed into coordinates on the
          page, then it will plan the motion for AxiDraw to plot the picture.
        </p>
        <Button
          onClick={() => {
            work.setPhase(WORK_PHASE_PREVIEW);
          }}
        >
          Back to preview
        </Button>
      </section>
      <section>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            work.planMotion({
              page,
              options: {
                connectedError,
              },
            });
          }}
        >
          <label htmlFor="page-padding">Connected Error: </label>
          <input
            id="page-padding"
            type="number"
            min="0"
            step="0.1"
            value={connectedError}
            onChange={(e) => setConnectedError(parseFloat(e.target.value))}
          />
          <div className="col-start-2">
            <Button variant="primary" submit ref={planningButtonRef}>
              Plan
            </Button>
          </div>
        </form>
      </section>
      <section className="space-y-4">
        <Alert type="info">
          You could adjust those parameter and redo the plan until you are
          satisfied. Or sent it to AxiDraw now:
        </Alert>
        <Button>
          <span className="inline-block w-32">Plot</span>
        </Button>
      </section>
    </Panel>
  );
});

Planning.propTypes = {};

export default Planning;
