import React, { useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import DeviceConnector from 'components/device-connector/device-connector';
import Alert from 'components/ui/alert/alert';
import Button from 'components/ui/button/button';
import {
  PLOTTER_SPEED_MODE_ACCELERATING,
  PLOTTER_SPEED_MODE_CONSTANT,
  PLOTTER_STATUS_PAUSED,
  PLOTTER_STATUS_PLOTTING,
  PLOTTER_STATUS_STANDBY,
} from 'plotter/consts';
import classNames from 'classnames';
import formStyles from 'components/ui/form.css';
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
            <label className="mr-2">Constant</label>
            <div className="flex items-center">
              <label className={classNames(formStyles.radioLabel, 'mr-2')}>
                <input
                  type="radio"
                  value={PLOTTER_SPEED_MODE_CONSTANT}
                  disabled={work.plotterStatus !== PLOTTER_STATUS_STANDBY}
                  checked={work.speedMode === PLOTTER_SPEED_MODE_CONSTANT}
                  onChange={() => {
                    work.setSpeedMode(PLOTTER_SPEED_MODE_CONSTANT);
                  }}
                />
                <span>Velocity</span>
              </label>{' '}
              <label className={formStyles.radioLabel}>
                <input
                  type="radio"
                  value={PLOTTER_SPEED_MODE_ACCELERATING}
                  disabled={work.plotterStatus !== PLOTTER_STATUS_STANDBY}
                  checked={work.speedMode === PLOTTER_SPEED_MODE_ACCELERATING}
                  onChange={() => {
                    work.setSpeedMode(PLOTTER_SPEED_MODE_ACCELERATING);
                  }}
                />
                <span>Acceleration</span>
              </label>
            </div>
            {work.speedMode === PLOTTER_SPEED_MODE_ACCELERATING && (
              <>
                <h4 className="col-span-2">Moving Acceleration</h4>
                <label htmlFor="pen-down-accel">Pen Down</label>
                <input
                  id="pen-down-accel"
                  type="number"
                  min="100"
                  step="100"
                  max="100000"
                  value={work.penDownMoveAccel}
                  onChange={(e) =>
                    work.setPenDownMoveAccel(parseInt(e.target.value, 10))
                  }
                />
                <label htmlFor="pen-down-accel">Cornering</label>
                <input
                  id="pen-down-accel"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max="2"
                  value={work.cornering}
                  onChange={(e) =>
                    work.setCornering(parseInt(e.target.value, 10))
                  }
                />
              </>
            )}
            <h4 className="col-span-2">
              Moving Speed{' '}
              {work.speedMode === PLOTTER_SPEED_MODE_ACCELERATING && '(Max)'}
            </h4>
            <label htmlFor="pen-down-speed">Pen Down</label>
            <input
              id="pen-down-speed"
              type="number"
              min="1000"
              step="100"
              max="20000"
              value={work.penDownMoveSpeed}
              onChange={(e) =>
                work.setPenDownMoveSpeed(parseInt(e.target.value, 10))
              }
            />
            <label htmlFor="pen-up-speed">Pen Up</label>
            <input
              id="pen-up-speed"
              type="number"
              min="1000"
              step="100"
              max="20000"
              value={work.penUpMoveSpeed}
              onChange={(e) =>
                work.setPenUpMoveSpeed(parseInt(e.target.value, 10))
              }
            />
            <h4 className="col-span-2">Pen Servo Control</h4>
            <label htmlFor="pen-down-speed">Pen Down</label>
            <input
              id="pen-down-speed"
              type="number"
              min="12000"
              step="100"
              max={work.servoMin}
              value={work.servoMax}
              onChange={(e) => work.setServoMax(parseInt(e.target.value, 10))}
            />
            <label htmlFor="pen-up-speed">Pen Up</label>
            <input
              id="pen-up-speed"
              type="number"
              min={work.servoMax}
              step="100"
              max="32000"
              value={work.servoMin}
              onChange={(e) => work.setServoMin(parseInt(e.target.value, 10))}
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
