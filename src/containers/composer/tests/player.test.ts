import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IDeviceConnector } from '@/communication/device/device';
import play, { PAUSE } from '../player';
import { travel } from '../stage';
import type { PlannedStep } from '../utils';

type Sent = [string, ...unknown[]];

const createDevice = ({
  prgAfter = Infinity,
  failOnSM = Infinity,
  disconnectAfter = Infinity,
}: { prgAfter?: number; failOnSM?: number; disconnectAfter?: number } = {}) => {
  const sent: Sent[] = [];
  let queries = 0;
  const device = {
    // eslint-disable-next-line @typescript-eslint/require-await
    async executeCommand(cmd: { cmd: string }, ...params: unknown[]) {
      if (sent.length >= disconnectAfter) {
        throw new Error('Device is not connected yet');
      }
      sent.push([cmd.cmd, ...params]);
      if (cmd.cmd === 'SM' && smMoves(sent).length === failOnSM) {
        throw new Error('!8 Err: unknown');
      }
      if (cmd.cmd === 'QB') {
        queries += 1;
        return queries > prgAfter ? 1 : 0;
      }
      return 'OK';
    },
  } as unknown as IDeviceConnector<unknown>;
  return { device, sent };
};

const moves: PlannedStep[] = [
  { step1: -300, step2: 100, duration: 500 },
  { step1: 300, step2: -200, duration: 500 },
  { step1: -600, step2: 0, duration: 1000 },
];

const start = { a1: 20000, a2: 3000 };

const playWith = async (
  device: IDeviceConnector<unknown>,
  options: Partial<Parameters<typeof play>[0]> = {},
) => {
  const playing = play({
    device,
    start,
    moves,
    motorMode: 1,
    penDown: false,
    isStopRequested: () => false,
    ...options,
  });
  // let the pen get home without waiting for it
  const done = playing.then(
    () => null,
    (error: unknown) => error,
  );
  await vi.runAllTimersAsync();
  return done;
};

const smMoves = (sent: Sent[]) =>
  sent.filter(([cmd]) => cmd === 'SM') as [string, number, number, number][];

const expectBackAtOrigin = (sent: Sent[]) => {
  const total = smMoves(sent).reduce(
    ([a1, a2], [, , step1, step2]) => [a1 + step1, a2 + step2],
    [0, 0],
  );
  expect(total).toEqual([0, 0]);
};

describe('play', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'performance'],
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('walks to the song, rests, plays, rests and walks back', async () => {
    const { device, sent } = createDevice();
    const stages: string[] = [];
    expect(
      await playWith(device, {
        penDown: true,
        onStage: (stage) => stages.push(stage),
      }),
    ).toBeNull();
    expect(stages).toEqual(['travelling', 'playing', 'returning']);
    const sequence = sent.filter(([cmd]) => cmd !== 'QB');
    expect(sequence).toEqual([
      ['R'],
      ['EM', 1, 1],
      ['SP', 1, 500, undefined],
      ['SM', expect.any(Number), start.a1, start.a2],
      ['SP', 0, 500, undefined],
      ['SM', PAUSE, 0, 0],
      ...moves.map(({ step1, step2, duration }) => [
        'SM',
        duration,
        step1,
        step2,
      ]),
      ['SP', 1, 500, undefined],
      ['SM', PAUSE, 0, 0],
      ['SM', expect.any(Number), -start.a1 + 600, -start.a2 + 100],
      ['R'],
    ]);
    expectBackAtOrigin(sent);
  });

  it('tells of each stage when the plotter gets to it', async () => {
    const { device } = createDevice();
    const stages: [string, number][] = [];
    const t0 = performance.now();
    await playWith(device, {
      onStage: (stage) => stages.push([stage, performance.now() - t0]),
    });
    // the song starts after the pen is up, has walked and has rested
    const walk = travel(start, 1)[0].duration;
    const playing = 500 + walk + PAUSE;
    // and the pen heads back once the last note has played
    const returning = playing + 2000;
    expect(stages).toEqual([
      ['travelling', 0],
      ['playing', playing],
      ['returning', returning],
    ]);
  });

  it('leaves no stage to tell of after a failure', async () => {
    // the device goes away in the middle of the song
    const { device } = createDevice({ disconnectAfter: 9 });
    const stages: string[] = [];
    const error = await playWith(device, {
      onStage: (stage) => stages.push(stage),
    });
    expect(error).toEqual(new Error('Device is not connected yet'));
    // the pen never got to play or head back, so the status never says so
    expect(stages).not.toContain('playing');
    expect(stages).not.toContain('returning');
  });

  it('waits for the pen to get home before resetting', async () => {
    const { device, sent } = createDevice();
    const playing = play({
      device,
      start,
      moves,
      motorMode: 1,
      penDown: false,
      isStopRequested: () => false,
    });
    // everything is queued at once, but the pen needs seconds to get home
    await vi.advanceTimersByTimeAsync(0);
    expect(sent.at(-1)?.[0]).toBe('SM');
    await vi.advanceTimersByTimeAsync(8000);
    expect(sent.at(-1)?.[0]).toBe('SM');
    await vi.runAllTimersAsync();
    await playing;
    expect(sent.at(-1)).toEqual(['R']);
  });

  it('goes back to the origin when stopped', async () => {
    const { device, sent } = createDevice();
    let notes = 0;
    await playWith(device, {
      isStopRequested: () => {
        notes += 1;
        return notes > 1;
      },
    });
    const played = smMoves(sent).filter(([, duration]) => duration === 500);
    expect(played).toHaveLength(1);
    expect(sent.at(-1)).toEqual(['R']);
    expectBackAtOrigin(sent);
  });

  it('goes back to the origin when the PRG button is pressed', async () => {
    const { device, sent } = createDevice({ prgAfter: 2 });
    await playWith(device);
    expect(smMoves(sent).filter(([, duration]) => duration === 1000)).toEqual(
      [],
    );
    expectBackAtOrigin(sent);
  });

  it('goes back to the origin when a command fails, then reports it', async () => {
    // after the walk and the rest, the EBB refuses the second note
    const { device, sent } = createDevice({ failOnSM: 4 });
    const error = await playWith(device);
    expect(error).toEqual(new Error('!8 Err: unknown'));
    // the refused note never moved the pen
    expectBackAtOrigin(
      sent.filter((_, i) => i !== sent.indexOf(smMoves(sent)[3])),
    );
    expect(sent.at(-1)).toEqual(['R']);
  });
});
