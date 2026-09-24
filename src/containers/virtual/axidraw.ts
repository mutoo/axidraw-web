import {
  compareStructural,
  observable,
  observableRef,
  reaction,
  runInAction,
} from 'mobx';
import type { PageSize } from '@/plotter/page-sizes';
import { findPageSize } from '@/plotter/page-sizes';
import type { Stroke } from './drawing';
import { createDrawing, tracePen } from './drawing';
import { createHostLink } from './host-link';
import createVM from './plotter';
import { createSettings } from './settings';
import { createSound } from './sound';

// everything in the virtual plotter window: the EBB, the paper on it and the
// pen in it, and the link to the app that drives it
export const createVirtualAxiDraw = ({
  version,
  paper,
  session,
  host,
}: {
  version: string;
  paper: string | null;
  session: string | null;
  host: Window;
}) => {
  const vm = createVM({ version });
  const settings = createSettings();
  const sound = createSound(vm.context);
  // the main window was clicked to open this one, so it may play sound
  sound.playThrough(host);
  const drawing = createDrawing();
  const state = observable(
    { paper: findPageSize(paper) },
    { paper: observableRef },
  );

  // put a blank sheet of another size on, and return what was on the old one
  const setPaper = (size: PageSize): readonly Stroke[] => {
    if (size.id === state.paper.id) return [];
    runInAction(() => {
      state.paper = size;
    });
    return drawing.clear();
  };

  const disposers = [
    tracePen(vm.context, drawing, () => settings.pen),
    reaction(
      () => ({ ...settings.pen }),
      (style) => {
        drawing.setStyle(style);
      },
      { equals: compareStructural },
    ),
    reaction(
      () => settings.speed,
      (speed) => {
        vm.setSpeed(speed);
      },
      { fireImmediately: true },
    ),
    reaction(
      () => settings.sound,
      (on) => {
        sound.setOn(on);
      },
      { fireImmediately: true },
    ),
  ];

  const link = createHostLink({
    vm,
    host,
    session,
    onConnect(config, from) {
      runInAction(() => {
        vm.context.version = config.version;
      });
      // the paper stays on for a host that wants the same size
      setPaper(findPageSize(config.paper));
      // it was clicked to connect, so it may play sound too
      sound.playThrough(from);
    },
  });
  // a main window that has gone can't play sound, nor should it be kept
  disposers.push(
    reaction(
      () => link.status,
      () => {
        sound.forgetGone();
      },
    ),
  );

  return {
    vm,
    settings,
    sound,
    drawing,
    link,
    get paper() {
      return state.paper;
    },
    setPaper,
    dispose() {
      link.dispose();
      disposers.forEach((dispose) => {
        dispose();
      });
      settings.dispose();
      sound.dispose();
      vm.destroy();
    },
  };
};

export type VirtualAxiDraw = ReturnType<typeof createVirtualAxiDraw>;
