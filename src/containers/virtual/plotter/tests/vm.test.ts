import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IVirtualPlotter } from '..';
import createVM, { IDLE_DELAY } from '..';
import { isFreeMode, penPosition } from '../utils';

describe('virtual plotter vm', () => {
  let vm: IVirtualPlotter;

  beforeEach(() => {
    vi.useFakeTimers();
    vm = createVM({ version: '2.8.1' });
  });

  afterEach(() => {
    vm.destroy();
    vi.useRealTimers();
  });

  it('goes idle once no command has come in for a while', async () => {
    expect(vm.context.idle).toBe(false);
    await vi.advanceTimersByTimeAsync(IDLE_DELAY);
    expect(vm.context.idle).toBe(true);

    const done = vm.execute('SM,1000,100,100');
    // a command takes control at once
    expect(vm.context.idle).toBe(false);
    await done;
    // the move itself is still to run
    await vi.advanceTimersByTimeAsync(1000 + IDLE_DELAY - 100);
    expect(vm.context.idle).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(vm.context.idle).toBe(true);
  });

  it('can be moved by hand only when idle with the pen up', async () => {
    const target = { a1: 800, a2: 400 };
    expect(vm.moveByHand(target)).toBe(false);

    await vi.advanceTimersByTimeAsync(IDLE_DELAY);
    expect(isFreeMode(vm.context)).toBe(true);
    expect(vm.moveByHand(target)).toBe(true);
    expect(penPosition(vm.context)).toEqual(target);
    // no step is taken, so the step counters don't change
    expect(vm.context.motor).toMatchObject({ a1: 0, a2: 0 });

    void vm.execute('SP,0');
    await vi.advanceTimersByTimeAsync(IDLE_DELAY);
    expect(vm.context.idle).toBe(true);
    expect(vm.moveByHand({ a1: 0, a2: 0 })).toBe(false);
    expect(penPosition(vm.context)).toEqual(target);
  });

  it('moves on from where the hand left the pen', async () => {
    await vi.advanceTimersByTimeAsync(IDLE_DELAY);
    vm.moveByHand({ a1: 800, a2: 400 });
    void vm.execute('SM,100,10,-10');
    await vi.advanceTimersByTimeAsync(200);
    expect(vm.context.motor).toMatchObject({ a1: 10, a2: -10 });
    expect(penPosition(vm.context)).toEqual({ a1: 810, a2: 390 });
  });

  it('hums while the carriage is pushed, as fast as it moves', async () => {
    await vi.advanceTimersByTimeAsync(IDLE_DELAY);
    vm.moveByHand({ a1: 0, a2: 0 });
    await vi.advanceTimersByTimeAsync(20);
    // 100 steps of motor 1 and 50 of motor 2 in 20 ms
    vm.moveByHand({ a1: 100, a2: -50 });
    expect(vm.context.motor.f1).toBeCloseTo(5000);
    expect(vm.context.motor.f2).toBeCloseTo(2500);
    // and stops once the hand does
    await vi.advanceTimersByTimeAsync(100);
    expect(vm.context.motor).toMatchObject({ f1: 0, f2: 0 });
  });

  it('stops humming when a command takes over', async () => {
    await vi.advanceTimersByTimeAsync(IDLE_DELAY);
    vm.moveByHand({ a1: 100, a2: 100 });
    expect(vm.context.motor.f1).toBeGreaterThan(0);
    void vm.execute('QB');
    expect(vm.context.motor).toMatchObject({ f1: 0, f2: 0 });
  });

  it('drops the commands that have not started when flushed', async () => {
    const move = vm.execute('SM,1000,100,100');
    const version = vi.fn();
    void vm.execute('V').then(version);
    await move;
    vm.flush();
    await vi.advanceTimersByTimeAsync(2000);
    expect(version).not.toHaveBeenCalled();
    // the move that had started carries on to its end
    expect(vm.context.motor).toMatchObject({ a1: 100, a2: 100 });
    // and new commands still run
    await expect(vm.execute('V')).resolves.toContain('2.8.1');
  });

  it('plays moves faster at a higher speed', async () => {
    vm.setSpeed(4);
    void vm.execute('SM,1000,400,0');
    await vi.advanceTimersByTimeAsync(260);
    expect(vm.context.motor.a1).toBe(400);
  });

  it('can change speed in the middle of a move', async () => {
    void vm.execute('SM,1000,1000,0');
    await vi.advanceTimersByTimeAsync(500);
    expect(vm.context.motor.a1).toBeGreaterThan(400);
    expect(vm.context.motor.a1).toBeLessThan(600);
    vm.setSpeed(Infinity);
    await vi.advanceTimersByTimeAsync(20);
    expect(vm.context.motor.a1).toBe(1000);
  });

  it('finishes moves and delays at once at infinite speed', async () => {
    vm.setSpeed(Infinity);
    const resolved: string[] = [];
    for (const command of [
      'SP,0,500',
      'SM,1000,100,100',
      'LM,85899,100,0,85899,100,0',
      'SP,1,500',
    ]) {
      void vm.execute(command).then(() => resolved.push(command));
    }
    await vi.advanceTimersByTimeAsync(0);
    expect(resolved).toHaveLength(4);
    expect(vm.context.motor).toMatchObject({ a1: 200, a2: 200 });
  });

  it('reports the PRG button once', async () => {
    vm.pressButton();
    await expect(vm.execute('QB')).resolves.toMatch(/^1/);
    await expect(vm.execute('QB')).resolves.toMatch(/^0/);
  });
});
