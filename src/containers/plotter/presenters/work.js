import { makeAutoObservable, observable } from 'mobx';
import plot, {
  PLOTTER_ACTION_PAUSE,
  PLOTTER_ACTION_STOP,
  PLOTTER_STATUS_PLOTTING,
  PLOTTER_STATUS_STANDBY,
} from 'plotter/plotter';

const createWork = () =>
  makeAutoObservable({
    device: observable.box(null, { deep: false }),
    setDevice(device) {
      this.device.set(device);
    },
    speed: observable.box(2000), // steps per seconds
    setSpeed(speed) {
      this.speed.set(speed);
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
        speed: this.speed,
        control: this.control,
      });
      this.plottingInProgress.set(plotting);
      await this.resume();
    },
    async resume() {
      const plotting = this.plottingInProgress.get();
      if (!plotting) {
        return;
      }
      this.control.set(null);
      this.plotterStatus = PLOTTER_STATUS_PLOTTING;
      const status = await plotting.next();
      this.plotterStatus = status.value;
      if (status.done) {
        this.plottingInProgress.set(null);
        this.control.set(null);
        const device = this.device.get();
        device.disconnectDevice();
      }
    },
    pause() {
      this.control.set(PLOTTER_ACTION_PAUSE);
    },
    async stop() {
      this.control.set(PLOTTER_ACTION_STOP);
    },
  });

export default createWork;
