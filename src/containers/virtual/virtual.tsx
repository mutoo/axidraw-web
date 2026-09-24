import { autorun, reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import queryString from 'query-string';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import {
  VIRTUAL_STATUS_CONNECTED,
  VIRTUAL_STATUS_DISCONNECTED,
} from '@/communication/device/consts';
import { useToast } from '@/hooks/use-toast';
import type { PageSize } from '@/plotter/page-sizes';
import type { VirtualAxiDraw } from './axidraw';
import { createVirtualAxiDraw } from './axidraw';
import Canvas from './components/canvas';
import PenHolder from './components/pen-holder';
import StatusBar from './components/status-bar';
import Toolbar from './components/toolbar';
import { hostLinkStatusLabel } from './host-link';
import styles from './virtual.module.css';

// the space kept around the paper, in px
const MARGIN = 32;

// fit the paper in the stage
const fit = (stage: { width: number; height: number }, paper: PageSize) => {
  // pixels to the mm
  const scale = Math.max(
    Math.min(
      (stage.width - MARGIN * 2) / paper.width,
      (stage.height - MARGIN * 2) / paper.height,
    ),
    0.5,
  );
  return {
    scale,
    left: (stage.width - paper.width * scale) / 2,
    top: (stage.height - paper.height * scale) / 2,
  };
};

// the window this one takes its commands from: the one that opened it, or
// the page it's framed in
const findHost = (): Window | null =>
  (window.opener as Window | null) ??
  (window.parent !== window ? window.parent : null);

const param = (value: unknown) => (typeof value === 'string' ? value : null);

const Stage = observer(({ axidraw }: { axidraw: VirtualAxiDraw }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(stage);
    return () => {
      observer.disconnect();
    };
  }, []);
  const { paper } = axidraw;
  const layout = size && fit(size, paper);
  return (
    <main className={styles.stage} ref={stageRef}>
      {layout && (
        <div
          className={styles.paper}
          ref={paperRef}
          style={{
            left: layout.left,
            top: layout.top,
            width: paper.width * layout.scale,
            height: paper.height * layout.scale,
          }}
        >
          <Canvas
            drawing={axidraw.drawing}
            paper={paper}
            scale={layout.scale}
          />
          <PenHolder
            vm={axidraw.vm}
            paper={paper}
            scale={layout.scale}
            paperRef={paperRef}
          />
        </div>
      )}
    </main>
  );
});

const VirtualPlotter = () => {
  const { toast } = useToast();
  const { search } = useLocation();
  // what the main window opened this one with
  const [options] = useState(() => {
    const { ebb, paper, session } = queryString.parse(search);
    return {
      version: param(ebb) ?? '2.7.0',
      paper: param(paper),
      session: param(session),
    };
  });
  const [axidraw, setAxidraw] = useState<VirtualAxiDraw | null>(null);

  useEffect(() => {
    const host = findHost();
    if (!host) {
      alert('Please open virtual plotter from axidraw web device connector!');
      window.location.href = '/';
      return;
    }
    const axidraw = createVirtualAxiDraw({ ...options, host });
    // the VM only exists inside this effect (it owns the AudioContext and the
    // window listeners), so it has to be published from here
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAxidraw(axidraw);
    return () => {
      axidraw.dispose();
    };
  }, [options]);

  // tell when the main window comes and goes
  useEffect(() => {
    if (!axidraw) return;
    return reaction(
      () => axidraw.link.status,
      (status) => {
        if (status === VIRTUAL_STATUS_CONNECTED) {
          toast({
            title: 'Ready',
            description: 'Please return to the main window to start plotting.',
          });
        } else if (status === VIRTUAL_STATUS_DISCONNECTED) {
          toast({
            title: 'Disconnected',
            description: axidraw.link.reason,
          });
        }
      },
    );
  }, [axidraw, toast]);

  // and in the title, to tell the window apart from the main one
  useEffect(() => {
    if (!axidraw) return;
    const { title } = document;
    const dispose = autorun(() => {
      document.title = `Virtual Plotter · ${hostLinkStatusLabel(axidraw.link.status)}`;
    });
    return () => {
      dispose();
      document.title = title;
    };
  }, [axidraw]);

  // a click here lets this window play the sound, if the main window can't
  useEffect(() => {
    if (!axidraw) return;
    const wake = () => {
      axidraw.sound.wake();
    };
    window.addEventListener('pointerdown', wake);
    window.addEventListener('keydown', wake);
    return () => {
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
    };
  }, [axidraw]);

  if (!axidraw) return null;
  return (
    <div className={styles.root}>
      <Toolbar axidraw={axidraw} />
      <Stage axidraw={axidraw} />
      <StatusBar axidraw={axidraw} />
    </div>
  );
};

export default VirtualPlotter;
