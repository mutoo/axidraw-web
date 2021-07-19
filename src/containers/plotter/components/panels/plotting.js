import React, { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import DeviceConnector from 'components/device-connector/device-connector';
import Alert from 'components/ui/alert/alert';
import Button from 'components/ui/button/button';
import {
  PLOTTER_STATUS_PAUSED,
  PLOTTER_STATUS_PLOTTING,
  PLOTTER_STATUS_STANDBY,
} from 'plotter/plotter';
import PlotterContext from '../../context';
import {
  PLANNING_PHASE_PLANNING,
  PLANNING_PHASE_PLOTTING,
} from '../../presenters/planning';
import Panel from './panel';
import styles from './plotting.css';

const Plotting = observer(({ ...props }) => {
  const { planning, work } = useContext(PlotterContext);
  const device = work.device.get();
  const plottingInProgress = work.plottingInProgress.get();
  return (
    <Panel active={planning.phase === PLANNING_PHASE_PLOTTING} {...props}>
      <DeviceConnector
        onConnected={(d) => work.setDevice(d)}
        onDisconnected={() => work.setDevice(null)}
      />
      {!device && (
        <section className="space-y-4">
          <h3>Plotting</h3>
          <Alert type="warn">Please connect to device before plotting.</Alert>
          <Button
            onClick={() => {
              planning.setPhase(PLANNING_PHASE_PLANNING);
            }}
          >
            Back to planning
          </Button>
        </section>
      )}
      {device && (
        <section className="space-y-4">
          <h3>Plotting</h3>
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              if (plottingInProgress) return;
              work.plot({ motions: planning.motions });
            }}
          >
            <label htmlFor="speed">Speed:</label>

            <input
              id="page-padding"
              type="number"
              min="1000"
              step="100"
              max="5000"
              value={work.speed}
              onChange={(e) => work.setSpeed(parseFloat(e.target.value))}
            />
            <div className="col-start-2">
              {work.plotterStatus === PLOTTER_STATUS_STANDBY && (
                <Button variant="primary" submit>
                  Start
                </Button>
              )}
              {work.plotterStatus === PLOTTER_STATUS_PLOTTING && (
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => {
                      work.pause();
                    }}
                    disabled={work.control.get() !== null}
                  >
                    Pause
                  </Button>
                  <Button
                    onClick={() => {
                      work.stop();
                    }}
                    disabled={work.control.get() !== null}
                  >
                    Stop
                  </Button>
                </div>
              )}
              {work.plotterStatus === PLOTTER_STATUS_PAUSED && (
                <Button
                  onClick={() => {
                    work.resume();
                  }}
                >
                  Resume
                </Button>
              )}
            </div>
          </form>
        </section>
      )}
    </Panel>
  );
});

Plotting.propTypes = {};

export default Plotting;
