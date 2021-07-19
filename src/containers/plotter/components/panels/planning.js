import React, { useContext, useLayoutEffect, useRef, useState } from 'react';
import Button from 'components/ui/button/button';
import Alert from 'components/ui/alert/alert';
import { observer } from 'mobx-react-lite';
import { mm2px } from 'math/svg';
import PlotterContext from '../../context';
import {
  PLANNING_PHASE_PLANNING,
  PLANNING_PHASE_PREVIEW,
} from '../../presenters/planning';
import Panel from './panel';
import styles from './planning.css';
import { PAGE_ORIENTATION_LANDSCAPE } from '../../presenters/page';

const Planning = observer(({ ...props }) => {
  const { planning, page } = useContext(PlotterContext);
  const [connectedError, setConnectedError] = useState(0.2);
  const planningButtonRef = useRef(null);
  useLayoutEffect(() => {
    // when switch to planning phase, extract svg to lines.
    if (planning.phase === PLANNING_PHASE_PLANNING) {
      // manually trigger a planning
      planningButtonRef.current.click();
    }
  }, [planning.phase]);
  return (
    <Panel active={planning.phase === PLANNING_PHASE_PLANNING} {...props}>
      <section>
        <h3>Planning</h3>
        <p className="mb-4">
          In this phase, the SVG would be transformed into coordinates on the
          page, then it will plan the motion for AxiDraw to plot the picture.
        </p>
        <Button
          onClick={() => {
            planning.setPhase(PLANNING_PHASE_PREVIEW);
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
            planning.planMotion({
              screenToPageMatrix: page.screenToPageMatrix,
              origin:
                page.orientation === PAGE_ORIENTATION_LANDSCAPE
                  ? [0, 0]
                  : [mm2px(page.size.height), 0],
              connectedError,
            });
          }}
        >
          <label htmlFor="page-padding">Connected Error: </label>
          <input
            id="page-padding"
            type="number"
            min="0"
            step="0.1"
            max="10"
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
