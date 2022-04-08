import { ENDING_CR } from 'communication/ebb/constants';
import { observable, reaction, runInAction } from 'mobx';
import * as commands from './commands';

export async function* executor(commandQueue) {
  while (true) {
    const { abort } = (yield) || { abort: false };
    if (abort) {
      return;
    }
    let head = commandQueue[0];
    while (head) {
      const [resolve, cmd] = head;
      // eslint-disable-next-line no-await-in-loop
      const { done, value: result } = await cmd.next();
      if (done) {
        resolve(result);
        commandQueue.shift();
      }
      head = commandQueue[0];
    }
  }
}

export default function createVM({ version }) {
  const initialMotor = { a1: 0, a2: 0, m1: 1, m2: 1 };
  const initialServo = { min: 0, max: 0, rate: 400 };
  const context = observable({
    version,
    pen: 1,
    PRG: 0,
    motor: { ...initialMotor },
    servo: { ...initialServo },
  });
  const commandQueue = [];
  const vm = executor(commandQueue);
  vm.next(); // ready

  const penDisposer = reaction(
    () => context.pen,
    (state) => {
      // eslint-disable-next-line no-console
      console.log(`pen state:${state}`);
    },
  );

  const audioCtx = new AudioContext();
  const osillator1 = audioCtx.createOscillator();
  osillator1.type = 'square';
  const osillator2 = audioCtx.createOscillator();
  osillator2.type = 'square';
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.01;
  osillator1.connect(gainNode);
  osillator2.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  osillator1.frequency.value = 0;
  osillator2.frequency.value = 0;
  osillator1.start();
  osillator2.start();

  const motorDisposer = reaction(
    () => [context.motor.f1, context.motor.f2],
    ([f1, f2]) => {
      osillator1.frequency.value = f1;
      osillator2.frequency.value = f2;
      // eslint-disable-next-line no-console
      console.log(`motor state:${[f1, f2]}, ${gainNode.gain.value}`);
    },
  );

  const notImplementedCmd = (cmd) => ({
    async *create() {
      return `!Err: ${cmd} is not implemented yet.${ENDING_CR}`;
    },
  });

  return {
    execute(command) {
      return new Promise((resolve) => {
        const [cmdStr, ...params] = command.trim().split(',');
        const cmd = commands[cmdStr.toLowerCase()] || notImplementedCmd(cmdStr);
        commandQueue.push([resolve, cmd.create(context, ...params)]);
        vm.next(); // kick off
      });
    },
    get context() {
      return context;
    },
    destroy() {
      vm.next({ abort: true }); // abort
      penDisposer();
      motorDisposer();
      osillator1.stop();
      osillator2.stop();
    },
  };
}
