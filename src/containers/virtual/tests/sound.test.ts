import { runInAction } from 'mobx';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVMContext } from '../plotter';
import { createSound } from '../sound';

class FakeParam {
  value = 0;
  setValueAtTime() {
    return this;
  }
}

class FakeNode {
  type = '';
  frequency = new FakeParam();
  gain = new FakeParam();
  stopped = false;
  connect() {
    return this;
  }
  start() {}
  stop() {
    this.stopped = true;
  }
}

// a window of the app with its own Web Audio, and the contexts made with it
const createAudioWindow = (state: AudioContextState = 'running') => {
  const made: FakeAudioContext[] = [];
  class FakeAudioContext {
    state = state;
    currentTime = 0;
    destination = {};
    nodes: FakeNode[] = [];
    constructor() {
      made.push(this);
    }
    createOscillator() {
      const node = new FakeNode();
      this.nodes.push(node);
      return node;
    }
    createGain() {
      const node = new FakeNode();
      this.nodes.push(node);
      return node;
    }
    close() {
      this.state = 'closed';
      return Promise.resolve();
    }
  }
  return {
    target: {
      AudioContext: FakeAudioContext,
      document: {},
    } as unknown as Window,
    made,
  };
};

describe('sound', () => {
  let own: ReturnType<typeof createAudioWindow>;

  beforeEach(() => {
    // this window, which hasn't been clicked yet
    own = createAudioWindow('suspended');
    vi.stubGlobal('window', own.target);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('plays through the main window, which has been clicked', () => {
    const main = createAudioWindow();
    const sound = createSound(createVMContext('2.7.0'));
    sound.playThrough(main.target);
    expect(main.made).toHaveLength(1);
    expect(own.made).toHaveLength(0);
    expect(sound.playing).toBe(true);
    sound.dispose();
  });

  it('hums at the rate the motors step', () => {
    const main = createAudioWindow();
    const context = createVMContext('2.7.0');
    const sound = createSound(context);
    sound.playThrough(main.target);
    runInAction(() => {
      context.motor.f1 = 440.7;
      context.motor.f2 = 220;
    });
    const [motor1, motor2] = main.made[0].nodes.slice(1);
    expect(motor1.frequency.value).toBe(440);
    expect(motor2.frequency.value).toBe(220);
    sound.dispose();
  });

  it('keeps playing through the same page, and moves to a new one', () => {
    const main = createAudioWindow();
    const sound = createSound(createVMContext('2.7.0'));
    sound.playThrough(main.target);
    sound.playThrough(main.target);
    expect(main.made).toHaveLength(1);

    // the main window reloads, and its sound goes with its page
    (main.target as unknown as { document: object }).document = {};
    sound.playThrough(main.target);
    expect(main.made).toHaveLength(2);
    expect(main.made[0].state).toBe('closed');
    sound.dispose();
  });

  it('plays here after a click when the main window can not', () => {
    const sound = createSound(createVMContext('2.7.0'));
    // a window of another site lends nothing
    sound.playThrough({} as Window);
    expect(own.made).toHaveLength(1);
    expect(sound.playing).toBe(false);

    // the click lets this window play
    own.made[0].state = 'closed';
    const clicked = createAudioWindow();
    vi.stubGlobal('window', clicked.target);
    sound.wake();
    expect(clicked.made).toHaveLength(1);
    expect(sound.playing).toBe(true);
    // and another click changes nothing
    sound.wake();
    expect(clicked.made).toHaveLength(1);
    sound.dispose();
  });

  it('lets go of a main window that has gone', () => {
    const main = createAudioWindow();
    const sound = createSound(createVMContext('2.7.0'));
    sound.playThrough(main.target);
    sound.forgetGone();
    expect(main.made[0].state).toBe('running');
    (main.target as unknown as { document: object }).document = {};
    sound.forgetGone();
    expect(main.made[0].state).toBe('closed');
    expect(main.made[0].nodes.slice(1).every(({ stopped }) => stopped)).toBe(
      true,
    );
    sound.dispose();
  });

  it('turns the volume down to nothing when off', () => {
    const main = createAudioWindow();
    const sound = createSound(createVMContext('2.7.0'));
    sound.playThrough(main.target);
    const gain = main.made[0].nodes[0];
    expect(gain.gain.value).toBeGreaterThan(0);
    sound.setOn(false);
    expect(gain.gain.value).toBe(0);
    sound.setOn(true);
    expect(gain.gain.value).toBeGreaterThan(0);
    sound.dispose();
  });
});
