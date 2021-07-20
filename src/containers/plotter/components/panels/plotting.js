import React, { useContext, useEffect, useState } from 'react';
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
  const [connectedDevice, setConnectedDevice] = useState(null);
  useEffect(() => {
    // the side effect ensure device disconnects when react was fast-refreshed
    work.device.set(connectedDevice);
    return () => {
      connectedDevice?.disconnectDevice();
    };
  }, [connectedDevice]);
  return (
    <Panel active={planning.phase === PLANNING_PHASE_PLOTTING} {...props}>
      <DeviceConnector
        onConnected={(d) => setConnectedDevice(d)}
        onDisconnected={() => setConnectedDevice(null)}
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
            <label htmlFor="pen-down-speed">Speed(Pen-down):</label>
            <input
              id="pen-down-speed"
              type="number"
              min="1000"
              step="100"
              max="20000"
              value={work.penDownMoveSpeed}
              onChange={(e) =>
                work.setPenDownMoveSpeed(parseFloat(e.target.value))
              }
            />
            <label htmlFor="pen-up-speed">Speed(Pen-up):</label>
            <input
              id="pen-up-speed"
              type="number"
              min="1000"
              step="100"
              max="20000"
              value={work.penUpMoveSpeed}
              onChange={(e) =>
                work.setPenUpMoveSpeed(parseFloat(e.target.value))
              }
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
