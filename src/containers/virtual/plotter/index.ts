import { observable, runInAction } from 'mobx';
import { ENDING_CR } from '@/communication/ebb/constants';
import type { CommandGenerator } from './command';
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
import { isFreeMode, movePenByHand, penPosition } from './utils';

// how long the plotter has to go without a command before it's idle
export const IDLE_DELAY = 3000;

// how long the motors keep humming once a hand stops pushing the carriage
const HAND_HUM_TIMEOUT = 80;

export type VirtualPlotterContext = {
  version: string;
  pen: number;
  PRG: number;
  motor: {
    // the global step counters, as QS reports them
    a1: number;
    a2: number;
    // where the pen is when the step counters are (0, 0), in 1/16 steps
    home1: number;
    home2: number;
    // the step mode both motors share: 1 for 1/16 steps ... 5 for full steps
    stepMode: number;
    f1: number;
    f2: number;
  };
  servo: {
    min: number;
    max: number;
    rate: number;
  };
  // how many times faster than real time the plotter moves, Infinity to
  // finish every move and delay at once
  speed: number;
  // no command has come in or run for IDLE_DELAY
  idle: boolean;
};

export interface IVirtualPlotter {
  execute(command: string): Promise<string>;
  // drop the commands that haven't started yet
  flush(): void;
  // press the PRG button, which the next QB reports
  pressButton(): void;
  // push the carriage to a1, a2 (in 1/16 steps) by hand, in free mode only
  moveByHand(position: { a1: number; a2: number }): boolean;
  setSpeed(speed: number): void;
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
  // called whenever the queue runs empty
  onDrained?: () => void,
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
    onDrained?.();
  }
}

export const createVMContext = (version: string): VirtualPlotterContext =>
  observable({
    version,
    pen: 1,
    PRG: 0,
    motor: { a1: 0, a2: 0, home1: 0, home2: 0, stepMode: 1, f1: 0, f2: 0 },
    servo: { min: 12000, max: 16000, rate: 400 },
    speed: 1,
    idle: false,
  });

export default function createVM({
  version,
}: {
  version: string;
}): IVirtualPlotter {
  const context = createVMContext(version);
  const commandQueue: CommandQueue = [];

  // the motors hum while a hand pushes the carriage, and stop soon after it
  // stops moving
  let lastHandMove = 0;
  let handTimer: ReturnType<typeof setTimeout> | undefined;
  const stopHandHum = () => {
    if (handTimer === undefined) return;
    clearTimeout(handTimer);
    handTimer = undefined;
    runInAction(() => {
      context.motor.f1 = 0;
      context.motor.f2 = 0;
    });
  };

  let destroyed = false;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const waitForIdle = () => {
    clearTimeout(idleTimer);
    if (destroyed) return;
    idleTimer = setTimeout(() => {
      runInAction(() => {
        context.idle = true;
      });
    }, IDLE_DELAY);
  };
  const busy = () => {
    clearTimeout(idleTimer);
    stopHandHum();
    if (context.idle) {
      runInAction(() => {
        context.idle = false;
      });
    }
  };

  const vm = executor(commandQueue, waitForIdle);
  void vm.next(); // ready
  waitForIdle();

  const notImplementedCmd = (cmd: string) => ({
    // eslint-disable-next-line @typescript-eslint/require-await
    async *create(_: VirtualPlotterContext): CommandGenerator {
      yield `!Err: ${cmd} is not implemented yet.${ENDING_CR}`;
      return;
    },
  });

  return {
    execute(command: string): Promise<string> {
      busy();
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
    flush() {
      // the head may be running already, and the executor drops it when done
      commandQueue.splice(1);
    },
    pressButton() {
      runInAction(() => {
        context.PRG = 1;
      });
    },
    moveByHand(position) {
      if (!isFreeMode(context)) return false;
      const now = performance.now();
      // pointer events come every few ms, and the first one of a push after
      // a while shouldn't count the wait
      const dt = Math.min(Math.max(now - lastHandMove, 8), 100);
      lastHandMove = now;
      const from = penPosition(context);
      const stepSize = 2 ** (context.motor.stepMode - 1);
      runInAction(() => {
        movePenByHand(context, position);
        // the carriage turns both motors, which hum at their step rate
        context.motor.f1 =
          (Math.abs(position.a1 - from.a1) * 1000) / stepSize / dt;
        context.motor.f2 =
          (Math.abs(position.a2 - from.a2) * 1000) / stepSize / dt;
      });
      clearTimeout(handTimer);
      handTimer = setTimeout(stopHandHum, HAND_HUM_TIMEOUT);
      return true;
    },
    setSpeed(speed: number) {
      if (!(speed > 0)) return;
      runInAction(() => {
        context.speed = speed;
      });
    },
    get context() {
      return context;
    },
    destroy() {
      destroyed = true;
      void vm.next({ abort: true }); // abort
      clearTimeout(idleTimer);
      clearTimeout(handTimer);
    },
  };
}
