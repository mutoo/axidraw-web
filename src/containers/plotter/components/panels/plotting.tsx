import classNames from 'clsx';
import { observer } from 'mobx-react-lite';
import { useContext, useEffect, useState } from 'react';
import { IDeviceConnector } from '@/communication/device/device';
import DeviceConnector from '@/components/device-connector/device-connector';
import Alert from '@/components/ui/alert/alert';
import Button from '@/components/ui/button/button';
import formStyles from '@/components/ui/form.module.css';
import {
  PLOTTER_STATUS_PAUSED,
  PLOTTER_STATUS_PLOTTING,
  PLOTTER_STATUS_STANDBY,
  PLOTTER_SPEED_MODE,
  PLOTTER_ACTION,
} from '@/plotter/consts';
import { PlotterContext } from '../../context';
import { PLANNING_PHASE } from '../../presenters/planning';
import { trackEvent } from '../../utils';
import Estimating from './esimating';
import Panel from './panel';
import styles from './plotting.module.css';
import SimpleDebugger from './simple-debugger';

const Plotting = observer(({ ...props }) => {
  const { planning, work } = useContext(PlotterContext);
  const device = work.device.get();
  const plottingInProgress = work.plottingInProgress.get();
  const [connectedDevice, setConnectedDevice] =
    useState<IDeviceConnector<unknown> | null>(null);
  useEffect(() => {
    // the side effect ensure device disconnects when react was fast-refreshed
    void work.setDevice(connectedDevice);
    return () => {
      void connectedDevice?.disconnectDevice().then(() => {
        void work.setDevice(null);
      });
    };
  }, [connectedDevice, work]);
  return (
    <Panel active={planning.phase === PLANNING_PHASE.PLOTTING} {...props}>
      {!device && (
        <section className="space-y-4">
          <h3>Plotting</h3>
          <Alert type="warn">Please connect to device before plotting.</Alert>
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => {
                planning.setPhase(PLANNING_PHASE.PLANNING);
                trackEvent('go to', PLANNING_PHASE[PLANNING_PHASE.PLANNING]);
              }}
            >
              Back to planning
            </Button>
            <Button
              onClick={() => {
                planning.setPhase(PLANNING_PHASE.SETUP);
                trackEvent('go to', PLANNING_PHASE[PLANNING_PHASE.SETUP]);
              }}
            >
              Start new plot
            </Button>
          </div>
        </section>
      )}
      <DeviceConnector
        onConnected={(d) => {
          setConnectedDevice(d);
        }}
        onDisconnected={() => {
          setConnectedDevice(null);
        }}
      />
      {device && (
        <section className="space-y-4">
          <h3>Plotting</h3>
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              if (plottingInProgress || !planning.motions) return;
              trackEvent('control', 'plot');
              void work.plot({ motions: planning.motions });
            }}
          >
            <label className="mr-2">Constant</label>
            <div className="flex items-center">
              <label className={classNames(formStyles.radioLabel, 'mr-2')}>
                <input
                  type="radio"
                  value={PLOTTER_SPEED_MODE.CONSTANT}
                  disabled={work.plotterStatus !== PLOTTER_STATUS_STANDBY}
                  checked={work.speedMode === PLOTTER_SPEED_MODE.CONSTANT}
                  onChange={() => {
                    work.setSpeedMode(PLOTTER_SPEED_MODE.CONSTANT);
                  }}
                />
                <span>Velocity</span>
              </label>{' '}
              <label className={formStyles.radioLabel}>
                <input
                  type="radio"
                  value={PLOTTER_SPEED_MODE.ACCELERATING}
                  disabled={work.plotterStatus !== PLOTTER_STATUS_STANDBY}
                  checked={work.speedMode === PLOTTER_SPEED_MODE.ACCELERATING}
                  onChange={() => {
                    work.setSpeedMode(PLOTTER_SPEED_MODE.ACCELERATING);
                  }}
                />
                <span>Acceleration</span>
              </label>
            </div>
            {work.speedMode === PLOTTER_SPEED_MODE.ACCELERATING && (
              <>
                <h4 className="col-span-2">Moving Optimization</h4>
                <label htmlFor="motion-accel">Acceleration</label>
                <input
                  id="motion-accel"
                  type="number"
                  min="100"
                  step="100"
                  max="100000"
                  value={work.penDownMoveAccel.get()}
                  onChange={(e) => {
                    work.setPenDownMoveAccel(parseInt(e.target.value, 10));
                  }}
                />
                <label htmlFor="motion-cornering">Cornering</label>
                <input
                  id="motion-cornering"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max="2"
                  value={work.cornering.get()}
                  onChange={(e) => {
                    work.setCornering(parseFloat(e.target.value));
                  }}
                />
              </>
            )}
            <h4 className="col-span-2">
              Moving Speed{' '}
              {work.speedMode === PLOTTER_SPEED_MODE.ACCELERATING && '(Max)'}
            </h4>
            <label htmlFor="pen-up-speed">Pen Up</label>
            <input
              id="pen-up-speed"
              type="number"
              min="1000"
              step="100"
              max="20000"
              value={work.penUpMoveSpeed.get()}
              onChange={(e) => {
                work.setPenUpMoveSpeed(parseInt(e.target.value, 10));
              }}
            />
            <label htmlFor="pen-down-speed">Pen Down</label>
            <input
              id="pen-down-speed"
              type="number"
              min="1000"
              step="100"
              max="20000"
              value={work.penDownMoveSpeed.get()}
              onChange={(e) => {
                work.setPenDownMoveSpeed(parseInt(e.target.value, 10));
              }}
            />
            <h4 className="col-span-2">Pen Servo Control</h4>
            <label htmlFor="servo-min">Pen Up</label>
            <input
              id="servo-min"
              type="number"
              min={work.servoMax.get()}
              step="100"
              max="32000"
              value={work.servoMin.get()}
              onChange={(e) => {
                work.setServoMin(parseInt(e.target.value, 10));
              }}
            />
            <label htmlFor="servo-max">Pen Down</label>
            <input
              id="servo-max"
              type="number"
              min="12000"
              step="100"
              max={work.servoMin.get()}
              value={work.servoMax.get()}
              onChange={(e) => {
                work.setServoMax(parseInt(e.target.value, 10));
              }}
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
                    disabled={work.controlSignal.get() !== null}
                  >
                    Pause
                  </Button>
                )}
                {work.plotterStatus === PLOTTER_STATUS_PAUSED && (
                  <Button
                    onClick={() => {
                      void work.resume({ action: PLOTTER_ACTION.RESUME });
                      trackEvent('control', 'resume');
                    }}
                  >
                    Resume
                  </Button>
                )}
                {work.plotterStatus !== PLOTTER_STATUS_STANDBY && (
                  <Button
                    onClick={() => {
                      void work.stop();
                      trackEvent('control', 'stop');
                    }}
                    disabled={work.controlSignal.get() !== null}
                  >
                    Stop
                  </Button>
                )}
              </div>
            </div>
          </form>
        </section>
      )}
      <Estimating />
      {device && work.plotterStatus === PLOTTER_STATUS_STANDBY && (
        <SimpleDebugger device={device} />
      )}
    </Panel>
  );
});

Plotting.propTypes = {};

export default Plotting;
