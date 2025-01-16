import { makeAutoObservable, observable } from 'mobx';
import { IDeviceConnector } from '@/communication/device/device';
import * as commands from '@/communication/ebb';
import { servoTime } from '@/math/ebb';
import {
  PLOTTER_ACTION,
  PLOTTER_SPEED_MODE,
  PLOTTER_STATUS_PAUSED,
  PLOTTER_STATUS_PLOTTING,
  PLOTTER_STATUS_STANDBY,
} from '@/plotter/consts';
import estimate from '@/plotter/estimator';
import { Motion } from '@/plotter/planner';
import plot, { PlotterFlow } from '@/plotter/plotter';

const createWork = () =>
  makeAutoObservable({
    device: observable.box<IDeviceConnector<unknown> | null>(null, {
      deep: false,
    }),
    async setDevice(device: IDeviceConnector<unknown> | null) {
      this.device.set(device);
      if (device) {
        const servoMin = this.servoMin.get();
        const servoMax = this.servoMax.get();
        const servoRate = this.servoRate.get();
        const servoDelay = servoTime(servoMin, servoMax, servoRate);
        await device.executeCommand(commands.sc, 4, servoMin); // sp 1, pen up
        await device.executeCommand(commands.sc, 5, servoMax); // sp 0, pen down
        await device.executeCommand(commands.sc, 10, servoRate);
        await device.executeCommand(commands.sp, 1, servoDelay, undefined);
      }
      const pip = this.plottingInProgress.get();
      if (!device && pip) {
        await pip.return(PLOTTER_STATUS_STANDBY);
        this.plottingInProgress.set(null);
        this.plotterStatus = PLOTTER_STATUS_STANDBY;
      }
    },
    speedMode: PLOTTER_SPEED_MODE.ACCELERATING,
    setSpeedMode(mode: PLOTTER_SPEED_MODE) {
      this.speedMode = mode;
    },
    // pen up position, for some reason it's large than servoMax
    servoMin: observable.box(20000),
    setServoMin(value: number) {
      this.servoMin.set(value);
    },
    // pen up position, for some reason it's smaller than servoMax
    servoMax: observable.box(16000),
    setServoMax(value: number) {
      this.servoMax.set(value);
    },
    servoRate: observable.box(400),
    setServoRate(value: number) {
      this.servoRate.set(value);
    },
    penDownMoveAccel: observable.box(40000), // steps per second squared
    penDownMoveSpeed: observable.box(5000), // steps per second
    penUpMoveSpeed: observable.box(10000), // steps per second
    cornering: observable.box(0.1), // mm
    setPenDownMoveAccel(accel: number) {
      this.penDownMoveAccel.set(accel);
    },
    setPenDownMoveSpeed(speed: number) {
      this.penDownMoveSpeed.set(speed);
    },
    setPenUpMoveSpeed(speed: number) {
      this.penUpMoveSpeed.set(speed);
    },
    setCornering(value: number) {
      this.cornering.set(value);
    },
    controlSignal: observable.box<PLOTTER_ACTION | null>(null),
    plotterStatus: PLOTTER_STATUS_STANDBY,
    plottingInProgress: observable.box<PlotterFlow | null>(null, {
      deep: false,
    }),
    estimate({ motions }: { motions: Motion[] }) {
      if (!motions.length) return 0;
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
    async plot({ motions }: { motions: Motion[] }) {
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
        controlSignal: this.controlSignal,
      });
      this.plottingInProgress.set(plotting);
      await this.resume({ action: null });
    },
    async resume({ action }: { action: PLOTTER_ACTION | null }) {
      const plotting = this.plottingInProgress.get();
      if (!plotting) {
        return;
      }
      this.plotterStatus = PLOTTER_STATUS_PLOTTING;
      const status = await plotting.next(action);
      this.plotterStatus = status.value;
      this.controlSignal.set(null);
      if (status.done) {
        this.plottingInProgress.set(null);
        const device = this.device.get();
        await device?.disconnectDevice();
      }
    },
    pause() {
      this.controlSignal.set(PLOTTER_ACTION.PAUSE);
    },
    async stop() {
      if (this.plotterStatus === PLOTTER_STATUS_PAUSED) {
        await this.resume({ action: PLOTTER_ACTION.STOP });
      } else {
        this.controlSignal.set(PLOTTER_ACTION.STOP);
      }
    },
  });

export default createWork;
