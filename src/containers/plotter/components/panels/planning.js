import React, { useContext, useLayoutEffect, useRef, useState } from 'react';
import Button from 'components/ui/button/button';
import Alert from 'components/ui/alert/alert';
import { observer } from 'mobx-react-lite';
import { mm2px } from 'math/svg';
import { saveAs } from 'file-saver';
import PlotterContext from '../../context';
import {
  PLANNING_PHASE_PLANNING,
  PLANNING_PHASE_PLOTTING,
  PLANNING_PHASE_SETUP,
} from '../../presenters/planning';
import Panel from './panel';
import styles from './planning.css';
import { PAGE_ORIENTATION_LANDSCAPE } from '../../presenters/page';
import { trackEvent } from '../../utils';

const Planning = observer(({ ...props }) => {
  const { planning, page } = useContext(PlotterContext);
  const [connectedError, setConnectedError] = useState(0.2);
  const [flatLineError, setFlatLineError] = useState(0.1);
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
            planning.setPhase(PLANNING_PHASE_SETUP);
            trackEvent('go to', PLANNING_PHASE_SETUP);
          }}
        >
          Back to Setup
        </Button>
      </section>
      <section>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            trackEvent('plan');
            planning.planMotion({
              screenToPageMatrix: page.screenToPageMatrix,
              origin:
                page.orientation === PAGE_ORIENTATION_LANDSCAPE
                  ? [0, 0]
                  : [mm2px(page.size.height), 0],
              connectedError,
              flatLineError,
            });
          }}
        >
          <label htmlFor="connected-error">Connected: </label>
          <input
            id="connected-error"
            type="number"
            min="0"
            step="0.05"
            max="10"
            value={connectedError}
            onChange={(e) => setConnectedError(parseFloat(e.target.value))}
          />
          <label htmlFor="flatten-error">Flatten: </label>
          <input
            id="flatten-error"
            type="number"
            min="0"
            step="0.01"
            max="2"
            value={flatLineError}
            onChange={(e) => setFlatLineError(parseFloat(e.target.value))}
          />
          <div className="col-start-2 grid grid-cols-2 gap-4">
            <Button submit ref={planningButtonRef}>
              Re-plan
            </Button>
            <Button
              onClick={() => {
                const blob = new Blob(
                  [
                    `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${page.width}mm" height="${page.height}mm" viewBox="0 0 ${page.width} ${page.height}">
  <g style="stroke: #000000; stroke-width: 0.1; fill: none;">
      <path d="${planning.linesAsPathDef}"></path>
  </g>  
</svg>
`,
                  ],
                  {
                    type: 'image/svg+xml;charset=utf-8',
                  },
                );
                saveAs(blob, `${planning.filename}-aw.svg`);
              }}
            >
              Export SVG
            </Button>
          </div>
        </form>
      </section>
      <section className="grid grid-cols-1 gap-4">
        <Alert type="info">
          Adjust parameters above and redo the planning until you are satisfied.
        </Alert>
        <Button
          variant="primary"
          onClick={() => {
            planning.setPhase(PLANNING_PHASE_PLOTTING);
            trackEvent('go to', PLANNING_PHASE_PLOTTING);
          }}
        >
          <span className="inline-block w-32">Next</span>
        </Button>
        <Button
          onClick={() => {
            planning.removePoint();
          }}
        >
          <span className="inline-block w-32">Remove Point</span>
        </Button>
        <h4>Planning Info:</h4>
        <dl className="grid grid-cols-2 gap-4">
          {Object.entries(planning.linesInfo).map((info) => (
            <>
              <dt>{info[0]}</dt>
              <dd>{info[1]}</dd>
            </>
          ))}
          {Object.entries(planning.motionsInfo).map((info) => (
            <>
              <dt>{info[0]}</dt>
              <dd>{info[1]}</dd>
            </>
          ))}
        </dl>
      </section>
    </Panel>
  );
});

Planning.propTypes = {};

export default Planning;
