import { autorun, reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import queryString from 'query-string';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import {
  VIRTUAL_STATUS_CONNECTED,
  VIRTUAL_STATUS_DISCONNECTED,
} from '@/communication/device/consts';
import { Rulers, RULER_REACH } from '@/components/ruler/ruler';
import { RULER_OFF, useRulerChoice } from '@/components/ruler/ruler-choice';
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
// how wide the rulers along the paper show, in px
const RULER_WIDTH = 26;

// fit the paper in the stage, and the rulers along its top and left edges
const fit = (
  stage: { width: number; height: number },
  paper: PageSize,
  rulers: boolean,
) => {
  // the room the rulers take off the paper, in px
  const inset = rulers ? RULER_WIDTH : 0;
  // what has to fit, in mm
  const width = rulers ? Math.max(paper.width, RULER_REACH) : paper.width;
  const height = rulers ? Math.max(paper.height, RULER_REACH) : paper.height;
  // pixels to the mm
  const scale = Math.max(
    Math.min(
      (stage.width - MARGIN * 2 - inset) / width,
      (stage.height - MARGIN * 2 - inset) / height,
    ),
    0.5,
  );
  return {
    scale,
    left: (stage.width - inset - width * scale) / 2 + inset,
    top: (stage.height - inset - height * scale) / 2 + inset,
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
  const [ruler] = useRulerChoice();
  const { paper } = axidraw;
  const layout = size && fit(size, paper, ruler !== RULER_OFF);
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
          {ruler !== RULER_OFF && (
            <svg
              className={styles.rulers}
              width={paper.width * layout.scale}
              height={paper.height * layout.scale}
              viewBox={`0 0 ${paper.width} ${paper.height}`}
            >
              <Rulers
                variant={ruler}
                thickness={RULER_WIDTH / layout.scale}
                pxPerMm={layout.scale}
              />
            </svg>
          )}
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
