import { ENDING_CR } from 'communication/ebb/constants';
import * as commands from './commands';

export const PEN_STATUS_UP = 'virtual-plotter-pen-status-up';
export const PEN_STATUS_DOWN = 'virtual-plotter-pen-status-down';

export async function* executor(commandQueue) {
  while (true) {
    yield;
    let head = commandQueue[0];
    if (head) {
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
  const context = {
    version,
    PRG: 0,
    motor: { ...initialMotor },
    servo: { ...initialServo },
  };
  const commandQueue = [];
  const vm = executor(commandQueue);
  vm.next(); // ready

  const notImplemenetedCmd = (cmd) => ({
    async *create() {
      return `!Err: ${cmd} is not implemented yet.${ENDING_CR}`;
    },
  });

  return {
    execute(command) {
      return new Promise((resolve) => {
        const [cmdStr, ...params] = command.trim().split(',');
        const cmd =
          commands[cmdStr.toLowerCase()] || notImplemenetedCmd(cmdStr);
        commandQueue.push([resolve, cmd.create(context, ...params)]);
        vm.next(); // kick off
      });
    },
  };
}
