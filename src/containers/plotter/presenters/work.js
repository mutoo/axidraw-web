import { makeAutoObservable, observable } from 'mobx';
import plot, {
  PLOTTER_ACTION_PAUSE,
  PLOTTER_ACTION_STOP,
  PLOTTER_STATUS_PAUSED,
  PLOTTER_STATUS_PLOTTING,
  PLOTTER_STATUS_STANDBY,
} from 'plotter/plotter';

const createWork = () =>
  makeAutoObservable({
    device: observable.box(null, { deep: false }),
    setDevice(device) {
      this.device.set(device);
      const pit = this.plottingInProgress.get();
      if (!device && pit) {
        pit.return();
        this.plottingInProgress.set(null);
      }
    },
    penDownMoveSpeed: observable.box(2000), // steps per seconds
    penUpMoveSpeed: observable.box(5000), // steps per seconds
    setPenDownMoveSpeed(speed) {
      this.penDownMoveSpeed.set(speed);
    },
    setPenUpMoveSpeed(speed) {
      this.penUpMoveSpeed.set(speed);
    },
    control: observable.box(null),
    plotterStatus: PLOTTER_STATUS_STANDBY,
    plottingInProgress: observable.box(null, { deep: false }),
    async plot({ motions }) {
      const device = this.device.get();
      if (!device) {
        throw new Error('Device is not connect.');
      }
      const plotting = plot({
        device,
        motions,
        penUpMoveSpeed: this.penUpMoveSpeed,
        penDownMoveSpeed: this.penDownMoveSpeed,
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
