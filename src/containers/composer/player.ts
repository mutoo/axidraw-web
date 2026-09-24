import type { IDeviceConnector } from '@/communication/device/device';
import * as commands from '@/communication/ebb';
import { MOTION_PEN_DOWN, MOTION_PEN_UP } from '@/plotter/consts';
import { delay } from '@/utils/time';
import type { AxisSteps } from './stage';
import { travel } from './stage';
import type { PlannedStep } from './utils';

// the servo's time to lift or lower the pen
const PEN_DELAY = 500; // ms
// the pen rests this long before and after the song
export const PAUSE = 1500; // ms
// extra wait for the pen to get home before the reset
const SETTLE = 250; // ms

export type PlayerStage = 'travelling' | 'playing' | 'returning';

/**
 * Plays a song on the plotter. The pen starts at the origin, walks to
 * `start`, rests, plays, rests and walks back to the origin, which it does
 * even when the song is stopped or fails, so that the next one starts from
 * the origin again.
 */
export default async function play({
  device,
  start,
  moves,
  motorMode,
  penDown,
  isStopRequested,
  onStage,
}: {
  device: IDeviceConnector<unknown>;
  start: AxisSteps;
  moves: PlannedStep[];
  motorMode: number;
  penDown: boolean;
  isStopRequested: () => boolean;
  onStage?: (stage: PlayerStage) => void;
}) {
  // where the pen is, in steps from the origin
  const pos = { a1: 0, a2: 0 };
  // when the EBB will have run all the commands queued so far
  let idleAt = performance.now();

  const queue = async (duration: number, send: () => Promise<unknown>) => {
    await send();
    // a queued command runs once it is received and the one before is done
    idleAt = Math.max(idleAt, performance.now()) + duration;
  };
  const move = ({ step1, step2, duration }: PlannedStep) =>
    queue(duration, async () => {
      await device.executeCommand(commands.sm, duration, step1, step2);
      pos.a1 += step1;
      pos.a2 += step2;
    });
  const rest = (duration: number) => move({ step1: 0, step2: 0, duration });
  const setPen = (pen: number) =>
    queue(PEN_DELAY, () =>
      device.executeCommand(commands.sp, pen, PEN_DELAY, undefined),
    );
  const goTo = async ({ a1, a2 }: AxisSteps) => {
    for (const leg of travel({ a1: a1 - pos.a1, a2: a2 - pos.a2 }, motorMode)) {
      await move(leg);
    }
  };
  // tells of a stage when the EBB gets to it rather than when it is queued
  const announcements: ReturnType<typeof setTimeout>[] = [];
  const announce = (stage: PlayerStage) => {
    const wait = idleAt - performance.now();
    announcements.push(setTimeout(() => onStage?.(stage), wait));
  };

  await device.executeCommand(commands.r);
  await device.executeCommand(commands.em, motorMode, motorMode);

  let failure: { error: unknown } | null = null;
  try {
    announce('travelling');
    await setPen(MOTION_PEN_UP);
    await goTo(start);
    if (penDown) {
      await setPen(MOTION_PEN_DOWN);
    }
    await rest(PAUSE);
    announce('playing');
    for (const step of moves) {
      // stop when asked to or when the PRG button was pressed
      if (isStopRequested() || (await device.executeCommand(commands.qb))) {
        break;
      }
      await move(step);
    }
  } catch (error) {
    failure = { error };
  }
  try {
    announce('returning');
    await setPen(MOTION_PEN_UP);
    await rest(PAUSE);
    await goTo({ a1: 0, a2: 0 });
    await delay(idleAt - performance.now() + SETTLE);
    await device.executeCommand(commands.r);
  } catch (error) {
    failure ??= { error };
  }
  // a failed song never gets to what is still to be announced
  announcements.forEach((timer) => {
    clearTimeout(timer);
  });
  if (failure) {
    throw failure.error;
  }
}
