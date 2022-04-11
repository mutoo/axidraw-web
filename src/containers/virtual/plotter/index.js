import { ENDING_CR } from 'communication/ebb/constants';
import { observable, reaction } from 'mobx';
import { servoTime } from 'math/ebb';
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
      if (result) {
        resolve(result);
      }
      if (done) {
        commandQueue.shift();
      }
      head = commandQueue[0];
    }
  }
}

export default function createVM({ version }) {
  const initialMotor = { a1: 0, a2: 0, m1: 1, m2: 1 };
  const initialServo = { min: 12000, max: 16000, rate: 400 };
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

  const audioCtx = new AudioContext();
  const osillatorNodeA1 = audioCtx.createOscillator();
  osillatorNodeA1.type = 'square';
  osillatorNodeA1.frequency.value = 0;
  const osillatorNodeA2 = audioCtx.createOscillator();
  osillatorNodeA2.type = 'square';
  osillatorNodeA2.frequency.value = 0;
  const osillatorNodeServo = audioCtx.createOscillator();
  osillatorNodeServo.type = 'sawtooth';
  osillatorNodeServo.frequency.value = 0;
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.005;
  gainNode.connect(audioCtx.destination);
  osillatorNodeA1.connect(gainNode);
  osillatorNodeA2.connect(gainNode);
  osillatorNodeServo.connect(gainNode);
  osillatorNodeA1.start();
  osillatorNodeA2.start();
  osillatorNodeServo.start();

  const penDisposer = reaction(
    () => context.pen,
    () => {
      const { min, max, rate } = context.servo;
      osillatorNodeServo.frequency.value = 600;
      const t = servoTime(min, max, rate) / 1000;
      osillatorNodeServo.frequency.setValueAtTime(0, audioCtx.currentTime + t);
    },
  );

  const motorDisposer = reaction(
    () => [context.motor.f1, context.motor.f2],
    ([f1, f2]) => {
      osillatorNodeA1.frequency.value = f1 | 0;
      osillatorNodeA2.frequency.value = f2 | 0;
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
      osillatorNodeA1.stop();
      osillatorNodeA2.stop();
      osillatorNodeServo.stop();
    },
  };
}
