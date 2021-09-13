import { makeAutoObservable, observable } from 'mobx';
import plot from 'plotter/plotter';
import estimate from 'plotter/estimator';
import {
  PLOTTER_ACTION_PAUSE,
  PLOTTER_ACTION_STOP,
  PLOTTER_SPEED_MODE_ACCELERATING,
  PLOTTER_STATUS_PAUSED,
  PLOTTER_STATUS_PLOTTING,
  PLOTTER_STATUS_STANDBY,
} from 'plotter/consts';
import * as commands from 'communication/ebb';
import { servoTime } from 'math/ebb';

const createWork = () =>
  makeAutoObservable({
    device: observable.box(null, { deep: false }),
    async setDevice(device) {
      this.device.set(device);
      if (device) {
        const servoMin = this.servoMin.get();
        const servoMax = this.servoMax.get();
        const servoRate = this.servoRate.get();
        const servoDelay = servoTime(servoMin, servoMax, servoRate);
        await device.executeCommand(commands.sc, 4, servoMin); // sp 1, pen up
        await device.executeCommand(commands.sc, 5, servoMax); // sp 0, pen down
        await device.executeCommand(commands.sc, 10, servoRate);
        await device.executeCommand(commands.sp, 1, servoDelay);
      }
      const pit = this.plottingInProgress.get();
      if (!device && pit) {
        pit.return();
        this.plottingInProgress.set(null);
      }
    },
    speedMode: PLOTTER_SPEED_MODE_ACCELERATING,
    setSpeedMode(mode) {
      this.speedMode = mode;
    },
    // pen up position, for some reason it's large than servoMax
    servoMin: observable.box(20000),
    async setServoMin(value) {
      this.servoMin.set(value);
    },
    // pen up position, for some reason it's smaller than servoMax
    servoMax: observable.box(16000),
    async setServoMax(value) {
      this.servoMax.set(value);
    },
    servoRate: observable.box(400),
    async setServoRate(value) {
      this.servoRate.set(value);
    },
    penDownMoveAccel: observable.box(40000), // steps per second squared
    penDownMoveSpeed: observable.box(5000), // steps per second
    penUpMoveSpeed: observable.box(10000), // steps per second
    cornering: observable.box(0.1), // mm
    setPenDownMoveAccel(accel) {
      this.penDownMoveAccel.set(accel);
    },
    setPenDownMoveSpeed(speed) {
      this.penDownMoveSpeed.set(speed);
    },
    setPenUpMoveSpeed(speed) {
      this.penUpMoveSpeed.set(speed);
    },
    setCornering(value) {
      this.cornering.set(value);
    },
    control: observable.box(null),
    plotterStatus: PLOTTER_STATUS_STANDBY,
    plottingInProgress: observable.box(null, { deep: false }),
    estimate({ motions }) {
      if (!motions) return 0;
      return estimate({
        motions,
        speedMode: this.speedMode,
        servoMin: this.servoMin,
        servoMax: this.servoMax,
        servoRate: this.servoRate,
        penDownMoveAccel: this.penDownMoveAccel,
        penUpMoveSpeed: this.penUpMoveSpeed,
        penDownMoveSpeed: this.penDownMoveSpeed,
        cornering: this.cornering,
      });
    },
    async plot({ motions }) {
      const device = this.device.get();
      if (!device) {
        throw new Error('Device is not connect.');
      }
      const plotting = plot({
        device,
        motions,
        speedMode: this.speedMode,
        servoMin: this.servoMin,
        servoMax: this.servoMax,
        servoRate: this.servoRate,
        penDownMoveAccel: this.penDownMoveAccel,
        penUpMoveSpeed: this.penUpMoveSpeed,
        penDownMoveSpeed: this.penDownMoveSpeed,
        cornering: this.cornering,
        control: this.control,
      });
      this.plottingInProgress.set(plotting);
      await this.resume();
    },
    async resume({ action } = {}) {
      const plotting = this.plottingInProgress.get();
      if (!plotting) {
        return;
      }
      this.plotterStatus = PLOTTER_STATUS_PLOTTING;
      const status = await plotting.next(action);
      this.plotterStatus = status.value;
      this.control.set(null);
      if (status.done) {
        this.plottingInProgress.set(null);
        const device = this.device.get();
        device.disconnectDevice();
      }
    },
    pause() {
      this.control.set(PLOTTER_ACTION_PAUSE);
    },
    async stop() {
      if (this.plotterStatus === PLOTTER_STATUS_PAUSED) {
        this.resume({ action: PLOTTER_ACTION_STOP });
      } else {
        this.control.set(PLOTTER_ACTION_STOP);
      }
    },
  });

export default createWork;
