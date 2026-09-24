import { reaction } from 'mobx';
import { windowDocument } from '@/communication/device/virtual';
import { servoTime } from '@/math/ebb';
import type { VirtualPlotterContext } from './plotter';

// the loudness of the motors and the servo
const VOLUME = 0.005;

type Voices = {
  ctx: AudioContext;
  // the window the sound plays through, and the page it had then
  window: Window;
  document: Document | null;
  motor1: OscillatorNode;
  motor2: OscillatorNode;
  servo: OscillatorNode;
  gain: GainNode;
};

// the AudioContext of a window of the app, if it has one to lend
const audioContextOf = (target: Window) => {
  try {
    const { AudioContext: Constructor } = target as Window & typeof globalThis;
    return typeof Constructor === 'function' ? Constructor : null;
  } catch {
    // another site
    return null;
  }
};

/**
 * The hum of the motors and the buzz of the servo.
 *
 * A browser lets a window play sound only once it has been clicked, and the
 * virtual plotter's window opens without a click. The main window has just
 * been clicked to open it, though, so the sound plays through the main
 * window: an AudioContext made with another window's constructor belongs to
 * that window's page. With no main window to play through, a click in this
 * one makes the sound play here instead.
 */
export const createSound = (context: VirtualPlotterContext) => {
  let voices: Voices | null = null;
  let on = true;

  const hum = () => {
    if (!voices) return;
    voices.motor1.frequency.value = context.motor.f1 | 0;
    voices.motor2.frequency.value = context.motor.f2 | 0;
  };

  const silence = () => {
    if (!voices) return;
    const { ctx, motor1, motor2, servo } = voices;
    voices = null;
    [motor1, motor2, servo].forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch {
        // its page is gone, and it with it
      }
    });
    if (ctx.state !== 'closed') {
      void ctx.close().catch(() => undefined);
    }
  };

  const playThrough = (target: Window) => {
    const Constructor = audioContextOf(target);
    if (!Constructor) return false;
    silence();
    const ctx = new Constructor();
    const gain = ctx.createGain();
    gain.gain.value = on ? VOLUME : 0;
    gain.connect(ctx.destination);
    const oscillator = (type: OscillatorType) => {
      const node = ctx.createOscillator();
      node.type = type;
      node.frequency.value = 0;
      node.connect(gain);
      node.start();
      return node;
    };
    voices = {
      ctx,
      window: target,
      document: windowDocument(target),
      motor1: oscillator('square'),
      motor2: oscillator('square'),
      servo: oscillator('sawtooth'),
      gain,
    };
    hum();
    return true;
  };

  // the sound needs making again once the page it played through is gone
  const isGone = ({ ctx, window: target, document }: Voices) =>
    ctx.state === 'closed' || windowDocument(target) !== document;

  const disposers = [
    reaction(() => [context.motor.f1, context.motor.f2], hum),
    reaction(
      () => context.pen,
      () => {
        if (!voices || context.speed === Infinity) return;
        const { min, max, rate } = context.servo;
        voices.servo.frequency.value = 600;
        const t = servoTime(min, max, rate) / 1000 / context.speed;
        voices.servo.frequency.setValueAtTime(0, voices.ctx.currentTime + t);
      },
    ),
  ];

  return {
    // play through a window of the app that has been clicked, unless the
    // sound plays through that page already
    playThrough(target: Window) {
      if (voices?.window === target && !isGone(voices)) return;
      if (!playThrough(target)) {
        playThrough(window);
      }
    },
    // a click in this window: it may play the sound itself if it has to
    wake() {
      if (voices && !isGone(voices) && voices.ctx.state === 'running') return;
      playThrough(window);
    },
    // let go of a page that has gone, which would otherwise be kept
    forgetGone() {
      if (voices && isGone(voices)) {
        silence();
      }
    },
    setOn(value: boolean) {
      on = value;
      if (voices) {
        voices.gain.gain.value = on ? VOLUME : 0;
      }
    },
    get playing() {
      return voices?.ctx.state === 'running';
    },
    dispose() {
      disposers.forEach((dispose) => {
        dispose();
      });
      silence();
    },
  };
};

export type Sound = ReturnType<typeof createSound>;
