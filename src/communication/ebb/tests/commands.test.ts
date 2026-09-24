import { describe, expect, it } from 'vitest';
import { es, qc, qg, sp } from '..';
import type { CommandGenerator, FinishedMessage } from '../command';
import { encode } from '../utils';

// send a command, feed it the device response and return what it parsed
const exchange = <R>(cmd: CommandGenerator<R>, response: string) => {
  const sent = cmd.next().value as string;
  const { done, value } = cmd.next([...encode(response)]);
  expect(done).toBe(true);
  return { sent, result: (value as FinishedMessage<R>).result };
};

// response examples below are taken from the EBB command reference
describe('EBB commands', () => {
  it('reads the QG status byte as hex', () => {
    const { result } = exchange(qg.create(), '3E\r\n');
    expect(result).toEqual({
      fifo: false,
      mtr2: true,
      mtr1: true,
      cmd: true,
      pen: true,
      prg: true,
      rb2: false,
      rb5: false,
    });
  });

  it('converts the QC readings to volts and amps', () => {
    const { result } = exchange(qc.create(), '0394,0300\r\nOK\r\n');
    expect(result).toEqual({
      ra0: { voltage: '1.27', maxCurrent: '0.72' },
      vPlus: { voltage: '9.20' },
    });
  });

  it('sends optional parameters as integers', () => {
    // e.g. servoTime() for a pen travel of 4100
    const { sent } = exchange(
      sp.create(1, 245.99999999999997, undefined),
      'OK\r\n',
    );
    expect(sent).toBe('SP,1,246\r');
  });

  it('sends ES without parameters when none are given', () => {
    const { sent } = exchange(
      es.create(...es.parseParams('')),
      '0,0,0,0,0\n\rOK\r\n',
    );
    expect(sent).toBe('ES\r');
  });
});
