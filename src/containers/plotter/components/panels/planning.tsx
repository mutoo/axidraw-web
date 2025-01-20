import classNames from 'clsx';
import { Tangent } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { Fragment, useContext, useLayoutEffect, useRef, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import formStyles from '@/components/ui/form.module.css';
import { saveFile } from '@/utils/file';
import { PlotterContext } from '../../context';
import { PLANNING_PHASE } from '../../presenters/planning';
import { trackEvent } from '../../utils';
import Panel from './panel';
import styles from './planning.module.css';

const Planning = observer(({ ...props }) => {
  const { planning, page } = useContext(PlotterContext);
  const [connectedError, setConnectedError] = useState(0.2);
  const [flatLineError, setFlatLineError] = useState(0.1);
  const [allowReorder, setAllowReorder] = useState(true);
  const planningButtonRef = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    // when switch to planning phase, extract svg to lines.
    if (planning.phase === PLANNING_PHASE.PLANNING) {
      // manually trigger a planning
      planningButtonRef.current?.click();
    }
  }, [planning.phase]);
  return (
    <Panel active={planning.phase === PLANNING_PHASE.PLANNING} {...props}>
      <section>
        <h3>Planning</h3>
        <p className="mb-4">
          In this phase, the SVG would be transformed into coordinates on the
          page, then it will plan the motion for AxiDraw to plot the picture.
        </p>
        <Button
          variant={'secondary'}
          onClick={() => {
            planning.setPhase(PLANNING_PHASE.SETUP);
            trackEvent('go to', PLANNING_PHASE[PLANNING_PHASE.SETUP]);
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
              connectedError,
              flatLineError,
              allowReorder,
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
            onChange={(e) => {
              setConnectedError(parseFloat(e.target.value));
            }}
          />
          <label htmlFor="flatten-error">Flatten: </label>
          <input
            id="flatten-error"
            type="number"
            min="0"
            step="0.01"
            max="2"
            value={flatLineError}
            onChange={(e) => {
              setFlatLineError(parseFloat(e.target.value));
            }}
          />
          <label
            className={classNames(formStyles.checkboxLabel, 'col-start-2')}
            htmlFor="allow-reorder"
          >
            <input
              type="checkbox"
              id="allow-reorder"
              checked={allowReorder}
              onChange={(e) => {
                setAllowReorder(e.target.checked);
              }}
            />
            <span>Optimize plotting order</span>
          </label>
          <div className="col-start-2 grid grid-cols-2 gap-4">
            <Button variant={'secondary'} type="submit" ref={planningButtonRef}>
              Re-plan
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const blob = new Blob(
                  [
                    `
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${page.width}mm" height="${page.height}mm" viewBox="0 0 ${page.width} ${page.height}">
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
                saveFile(blob, `${planning.filename}-aw.svg`, 'image/svg+xml');
              }}
            >
              Export SVG
            </Button>
          </div>
        </form>
      </section>
      <section className="grid grid-cols-1 gap-4">
        <Alert variant="default">
          <Tangent className="h-4 w-4" />
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>
            Adjust parameters above and redo the planning until you are
            satisfied.
          </AlertDescription>
        </Alert>
        <Button
          variant="default"
          onClick={() => {
            planning.setPhase(PLANNING_PHASE.PLOTTING);
            trackEvent('go to', PLANNING_PHASE[PLANNING_PHASE.PLOTTING]);
          }}
        >
          <span className="inline-block w-32">Next</span>
        </Button>
        <h4>Planning Info:</h4>
        <dl className="grid grid-cols-2 gap-4">
          {Object.entries(planning.linesInfo).map((info) => (
            <Fragment key={info[0]}>
              <dt>{info[0]}</dt>
              <dd>{info[1]}</dd>
            </Fragment>
          ))}
          {Object.entries(planning.motionsInfo).map((info) => (
            <Fragment key={info[0]}>
              <dt>{info[0]}</dt>
              <dd>{info[1]}</dd>
            </Fragment>
          ))}
        </dl>
      </section>
    </Panel>
  );
});

Planning.propTypes = {};

export default Planning;
