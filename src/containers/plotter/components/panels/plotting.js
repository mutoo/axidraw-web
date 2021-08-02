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
import SimpleDebugger from './simple-debugger';
import Panel from './panel';
import styles from './plotting.css';
import { trackEvent } from '../../utils';

const Plotting = observer(({ ...props }) => {
  const { planning, work } = useContext(PlotterContext);
  const device = work.device.get();
  const plottingInProgress = work.plottingInProgress.get();
  const [connectedDevice, setConnectedDevice] = useState(null);
  useEffect(() => {
    // the side effect ensure device disconnects when react was fast-refreshed
    work.setDevice(connectedDevice);
    return () => {
      connectedDevice?.disconnectDevice();
    };
  }, [connectedDevice]);
  return (
    <Panel active={planning.phase === PLANNING_PHASE_PLOTTING} {...props}>
      {!device && (
        <section className="space-y-4">
          <h3>Plotting</h3>
          <Alert type="warn">Please connect to device before plotting.</Alert>
          <div className="grid grid-cols-2 gap-6">
            <Button
              onClick={() => {
                planning.setPhase(PLANNING_PHASE_PLANNING);
                trackEvent('go to', PLANNING_PHASE_PLANNING);
              }}
            >
              Back to planning
            </Button>
          </div>
        </section>
      )}
      <DeviceConnector
        onConnected={(d) => setConnectedDevice(d)}
        onDisconnected={() => setConnectedDevice(null)}
      />
      {device && (
        <section className="space-y-4">
          <h3>Plotting</h3>
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              if (plottingInProgress) return;
              trackEvent('control', 'plot');
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
              <div className="grid grid-cols-2 gap-4">
                {work.plotterStatus === PLOTTER_STATUS_PLOTTING && (
                  <Button
                    onClick={() => {
                      work.pause();
                      trackEvent('control', 'pause');
                    }}
                    disabled={work.control.get() !== null}
                  >
                    Pause
                  </Button>
                )}
                {work.plotterStatus === PLOTTER_STATUS_PAUSED && (
                  <Button
                    onClick={() => {
                      work.resume();
                      trackEvent('control', 'resume');
                    }}
                  >
                    Resume
                  </Button>
                )}
                {work.plotterStatus !== PLOTTER_STATUS_STANDBY && (
                  <Button
                    onClick={() => {
                      work.stop();
                      trackEvent('control', 'stop');
                    }}
                    disabled={work.control.get() !== null}
                  >
                    Stop
                  </Button>
                )}
              </div>
            </div>
          </form>
        </section>
      )}
      {device && work.plotterStatus === PLOTTER_STATUS_STANDBY && (
        <SimpleDebugger device={device} />
      )}
    </Panel>
  );
});

Plotting.propTypes = {};

export default Plotting;
