import { observable, reaction } from 'mobx';
import { ENDING_CR } from '@/communication/ebb/constants';
import { servoTime } from '@/math/ebb';
import { CommandGenerator } from './command';
import { default as em } from './commands/em';
import { default as hm } from './commands/hm';
import { default as lm } from './commands/lm';
import { default as qb } from './commands/qb';
import { default as qs } from './commands/qs';
import { default as r } from './commands/r';
import { default as sc } from './commands/sc';
import { default as sm } from './commands/sm';
import { default as sp } from './commands/sp';
import { default as sr } from './commands/sr';
import { default as tp } from './commands/tp';
import { default as v } from './commands/v';

export type VirtualPlotterContext = {
  version: string;
  pen: number;
  PRG: number;
  motor: {
    a1: number;
    a2: number;
    m1: number;
    m2: number;
    f1: number;
    f2: number;
  };
  servo: {
    min: number;
    max: number;
    rate: number;
  };
  mode: string;
};

export interface IVirtualPlotter {
  execute(command: string): Promise<string>;
  context: VirtualPlotterContext;
  destroy(): void;
}

type PendingCommand = [
  resolve: (result: string) => void,
  cmd: AsyncGenerator<string, void, void>,
];
type CommandQueue = PendingCommand[];

export async function* executor(
  commandQueue: CommandQueue,
): AsyncGenerator<void, void, { abort: boolean }> {
  for (;;) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const { abort } = (yield) ?? { abort: false };
    if (abort) {
      return;
    }
    let head = commandQueue[0] as PendingCommand | undefined;
    while (head) {
      const [resolve, cmd] = head;
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

export default function createVM({
  version,
}: {
  version: string;
}): IVirtualPlotter {
  const initialMotor = { a1: 0, a2: 0, m1: 1, m2: 1, f1: 0, f2: 0 };
  const initialServo = { min: 12000, max: 16000, rate: 400 };
  const context: VirtualPlotterContext = observable({
    version,
    pen: 1,
    PRG: 0,
    motor: { ...initialMotor },
    servo: { ...initialServo },
    mode: 'normal',
  });
  const commandQueue: CommandQueue = [];
  const vm = executor(commandQueue);
  void vm.next(); // ready

  // Simulate audio output
  const audioCtx = new AudioContext();
  // motor A1
  const osillatorNodeA1 = audioCtx.createOscillator();
  osillatorNodeA1.type = 'square';
  osillatorNodeA1.frequency.value = 0;
  // motor A2
  const osillatorNodeA2 = audioCtx.createOscillator();
  osillatorNodeA2.type = 'square';
  osillatorNodeA2.frequency.value = 0;
  // pen servo
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

  const notImplementedCmd = (cmd: string) => ({
    // eslint-disable-next-line @typescript-eslint/require-await
    async *create(_: VirtualPlotterContext): CommandGenerator {
      yield `!Err: ${cmd} is not implemented yet.${ENDING_CR}`;
      return;
    },
  });

  return {
    execute(command: string): Promise<string> {
      return new Promise<string>((resolve) => {
        const [cmdStr, ...params] = command.trim().split(',');
        switch (cmdStr.toLowerCase()) {
          case 'em':
            {
              const [m1, m2] = params.map((s) => parseInt(s, 10));
              commandQueue.push([resolve, em.create(context, m1, m2)]);
            }
            break;
          case 'hm':
            {
              const [f, p1, p2] = params.map((s) => parseInt(s, 10));
              commandQueue.push([resolve, hm.create(context, f, p1, p2)]);
            }
            break;
          case 'lm':
            {
              const [r1, s1, a1, r2, s2, a2, c] = params.map((s) =>
                parseInt(s, 10),
              );
              commandQueue.push([
                resolve,
                lm.create(context, r1, s1, a1, r2, s2, a2, c),
              ]);
            }
            break;
          case 'qb':
            commandQueue.push([resolve, qb.create(context)]);
            break;
          case 'qs':
            commandQueue.push([resolve, qs.create(context)]);
            break;
          case 'sc':
            {
              const [key, value] = params.map((s) => parseInt(s, 10));
              commandQueue.push([resolve, sc.create(context, key, value)]);
            }
            break;
          case 'sm':
            {
              const [duration, d1, d2] = params.map((s) => parseInt(s, 10));
              commandQueue.push([
                resolve,
                sm.create(context, duration, d1, d2),
              ]);
            }
            break;
          case 'sp':
            {
              const [value, duration] = params.map((s) => parseInt(s, 10));
              commandQueue.push([resolve, sp.create(context, value, duration)]);
            }
            break;
          case 'sr':
            commandQueue.push([resolve, sr.create(context)]);
            break;
          case 'tp':
            {
              const [p] = params.map((s) => parseInt(s, 10));
              commandQueue.push([resolve, tp.create(context, p)]);
            }
            break;
          case 'v':
            commandQueue.push([resolve, v.create(context)]);
            break;
          case 'r':
            commandQueue.push([resolve, r.create(context)]);
            break;
          default:
            commandQueue.push([
              resolve,
              notImplementedCmd(cmdStr).create(context),
            ]);
        }
        void vm.next(); // kick off
      });
    },
    get context() {
      return context;
    },
    destroy() {
      void vm.next({ abort: true }); // abort
      penDisposer();
      motorDisposer();
      osillatorNodeA1.stop();
      osillatorNodeA2.stop();
      osillatorNodeServo.stop();
    },
  };
}
