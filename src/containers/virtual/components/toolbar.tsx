import classNames from 'clsx';
import { Camera, Eraser, FileDown, Volume2, VolumeX } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import {
  VIRTUAL_STATUS_CONNECTED,
  VIRTUAL_STATUS_CONNECTING,
} from '@/communication/device/consts';
import PageSizeSelect from '@/components/page-size-select/page-size-select';
import RulerSelect from '@/components/ruler/ruler-select';
import { Button } from '@/components/ui/button';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import type { PageSize } from '@/plotter/page-sizes';
import { pageSizeLabel } from '@/plotter/page-sizes';
import { saveFile } from '@/utils/file';
import type { VirtualAxiDraw } from '../axidraw';
import type { Stroke } from '../drawing';
import { drawingToCanvas, drawingToSVG } from '../drawing';
import { hostLinkStatusLabel } from '../host-link';
import { penColors, penWidths, speedLabel, speeds } from '../settings';
import styles from './toolbar.module.css';

// the resolution of a snapshot, 300 dpi
const SNAPSHOT_SCALE = 300 / 25.4;

// how long a clear can be undone for, in ms
const UNDO_DURATION = 10000;

const pad = (n: number) => String(n).padStart(2, '0');

const fileName = (paper: PageSize) => {
  const now = new Date();
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `virtual-plotter-${paper.id}-${date}-${time}`;
};

const HostStatus = observer(({ axidraw }: { axidraw: VirtualAxiDraw }) => {
  const { status, reason } = axidraw.link;
  const connected = status === VIRTUAL_STATUS_CONNECTED;
  const connecting = status === VIRTUAL_STATUS_CONNECTING;
  return (
    <div
      className={styles.status}
      role="status"
      title={
        connected
          ? 'The main window is connected to this virtual plotter.'
          : connecting
            ? 'Waiting for the main window to connect.'
            : `${reason} Connect the virtual plotter again from the main window.`
      }
    >
      <span
        className={classNames(styles.light, {
          [styles.connected]: connected,
          [styles.connecting]: connecting,
        })}
      />
      <span className={styles.statusLabel}>{hostLinkStatusLabel(status)}</span>
    </div>
  );
});

const Toolbar = observer(({ axidraw }: { axidraw: VirtualAxiDraw }) => {
  const { toast } = useToast();
  const { vm, settings, drawing, paper } = axidraw;
  const customColor = !penColors.some(
    ({ value }) => value === settings.pen.color,
  );

  // taking the drawing off can be undone, until the paper is cleared again
  const offerUndo = (
    title: string,
    removed: readonly Stroke[],
    undo: () => void,
  ) => {
    if (!removed.length) return;
    const { generation } = drawing;
    toast({
      title,
      duration: UNDO_DURATION,
      action: (
        <ToastAction
          altText="Undo"
          onClick={() => {
            if (drawing.generation === generation) undo();
          }}
        >
          Undo
        </ToastAction>
      ),
    });
  };

  return (
    <header className={styles.root}>
      <HostStatus axidraw={axidraw} />
      <div className={styles.tools}>
        <div className={styles.group}>
          <PageSizeSelect
            className={classNames(styles.select, styles.paper)}
            value={paper.id}
            title={`${pageSizeLabel(paper)}: another size is a blank sheet`}
            aria-label="Paper size"
            onChange={(size) => {
              const previous = axidraw.paper;
              const removed = axidraw.setPaper(size);
              offerUndo(`New ${axidraw.paper.name} sheet`, removed, () => {
                // nothing is lost going back to a sheet that's still blank
                if (!drawing.isEmpty) return;
                axidraw.setPaper(previous);
                drawing.restore(removed);
              });
            }}
          />
          <RulerSelect
            className={styles.select}
            title="The rulers along the top and left edges of the paper"
            aria-label="Ruler"
          />
        </div>
        <div className={styles.group} role="group" aria-label="Pen">
          {penColors.map(({ name, value }) => (
            <button
              key={value}
              type="button"
              className={classNames(styles.swatch, {
                [styles.selected]: settings.pen.color === value,
              })}
              style={{ backgroundColor: value }}
              title={`${name} pen`}
              aria-label={`${name} pen`}
              aria-pressed={settings.pen.color === value}
              onClick={() => {
                settings.setPenColor(value);
              }}
            />
          ))}
          <label
            className={classNames(styles.swatch, styles.customColor, {
              [styles.selected]: customColor,
            })}
            style={customColor ? { background: settings.pen.color } : undefined}
            title="A pen of another color"
          >
            <input
              type="color"
              value={settings.pen.color}
              aria-label="Pen color"
              onChange={(e) => {
                settings.setPenColor(e.target.value);
              }}
            />
          </label>
          <select
            className={styles.select}
            value={settings.pen.width}
            title="Pen tip"
            aria-label="Pen tip"
            onChange={(e) => {
              settings.setPenWidth(Number(e.target.value));
            }}
          >
            {penWidths.map((width) => (
              <option key={width} value={width}>
                {width} mm
              </option>
            ))}
          </select>
        </div>
        <div className={styles.group}>
          <select
            className={styles.select}
            value={speeds.indexOf(settings.speed)}
            title="Speed of the motions"
            aria-label="Speed"
            onChange={(e) => {
              settings.setSpeed(speeds[Number(e.target.value)]);
            }}
          >
            {speeds.map((speed, i) => (
              <option key={speed} value={i}>
                {speedLabel(speed)}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="icon"
            title={settings.sound ? 'Mute the motors' : 'Unmute the motors'}
            aria-label="Motor sound"
            aria-pressed={settings.sound}
            onClick={() => {
              settings.setSound(!settings.sound);
            }}
          >
            {settings.sound ? <Volume2 /> : <VolumeX />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={classNames({ [styles.pressed]: vm.context.PRG })}
            title="Press the PRG button, e.g. to pause a plot"
            onClick={() => {
              vm.pressButton();
            }}
          >
            PRG
          </Button>
        </div>
        <div className={styles.group}>
          <Button
            variant="outline"
            size="sm"
            title="Clear the paper"
            onClick={() => {
              const removed = drawing.clear();
              offerUndo('Paper cleared', removed, () => {
                drawing.restore(removed);
              });
            }}
          >
            <Eraser />
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            title="Save the paper as a PNG image (300 dpi)"
            onClick={() => {
              const canvas = drawingToCanvas(drawing, paper, SNAPSHOT_SCALE);
              const name = `${fileName(paper)}.png`;
              canvas.toBlob((blob) => {
                if (blob) saveFile(blob, name, 'image/png');
              }, 'image/png');
            }}
          >
            <Camera />
            PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            title="Save the drawing as an SVG, in mm"
            onClick={() => {
              saveFile(
                drawingToSVG(drawing.strokes, paper),
                `${fileName(paper)}.svg`,
                'image/svg+xml',
              );
            }}
          >
            <FileDown />
            SVG
          </Button>
        </div>
      </div>
    </header>
  );
});

export default Toolbar;
