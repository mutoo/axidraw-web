import { ToggleLeft } from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import type { IDeviceConnector } from '@/communication/device/device';
import * as commands from '@/communication/ebb';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import formStyles from '@/components/ui/form.module.css';
import { delay } from '@/utils/time';
import * as songs from '../songs';
import type { RawSong } from '../utils';
import {
  parseNote,
  planSteps,
  songToSteps,
  trackEvent,
  logger,
} from '../utils';

type SongsType = typeof songs;
type SongId = keyof SongsType;
const songList = Object.keys(songs) as SongId[];
// eslint-disable-next-line import-x/namespace
const getSong = (songId: SongId): RawSong => songs[songId];

const MidiCommander = ({ device }: { device: IDeviceConnector<unknown> }) => {
  const [channel1, setChannel1] = useState(() =>
    getSong(songList[0]).channel1.join(', '),
  );
  const [channel2, setChannel2] = useState(() =>
    getSong(songList[0]).channel2.join(', '),
  );
  const [BPM, setBPM] = useState(88);
  const [motorMode, setMotorMode] = useState(1);
  const [penDown, setPenDown] = useState(false);
  const [playing, setPlaying] = useState(false);
  const vPRGRef = useRef(false);
  const [results, setResults] = useState('');
  const sendCommands = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      void (async () => {
        try {
          trackEvent('play');

          const steps = songToSteps(
            {
              channel1: channel1
                .split(', ')
                .filter(Boolean)
                .map((str) => parseNote(str)),
              channel2: channel2
                .split(', ')
                .filter(Boolean)
                .map((str) => parseNote(str)),
            },
            BPM,
          );
          logger.info('Start playing song');
          setPlaying(true);

          // set home
          await device.executeCommand(commands.r);
          await device.executeCommand(commands.em, motorMode, motorMode);
          await device.executeCommand(
            commands.sp,
            penDown ? 0 : 1,
            500,
            undefined,
          );

          for (const step of planSteps(steps)) {
            const shouldStop = await device.executeCommand(commands.qb);
            if (shouldStop || vPRGRef.current) {
              await device.executeCommand(commands.r);
              await device.executeCommand(commands.sp, 1, 500, undefined);
              vPRGRef.current = false;
              return;
            }
            await device.executeCommand(
              commands.sm,
              step.duration,
              step.step1,
              step.step2,
            );
          }

          logger.info('Song finished');

          await device.executeCommand(commands.sp, 1, 500, undefined);
          await delay(2000);
          const st = await device.executeCommand(commands.qs);
          const dist = Math.sqrt(st.a1 ** 2 + st.a2 ** 2);
          const homeStepFreq = 1000;
          const homeDuration = (dist / homeStepFreq) * 1000;
          await device.executeCommand(
            commands.hm,
            homeStepFreq,
            undefined,
            undefined,
          );
          await delay(homeDuration);
          await device.executeCommand(commands.r);
        } catch (err) {
          setResults(String(err));
        } finally {
          setPlaying(false);
        }
      })();
    },
    [device, motorMode, BPM, penDown, channel1, channel2],
  );
  return (
    <form className={formStyles.root} onSubmit={sendCommands}>
      <h3>Midi Commander</h3>
      <p>Compose notes and send commands to device.</p>
      <label className={formStyles.inputLabel}>
        <span>Song:</span>
        <select
          defaultValue={songList[0]}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            const song = getSong(e.target.value as SongId);
            setChannel1(song.channel1.join(', '));
            setChannel2(song.channel2.join(', '));
          }}
          disabled={playing}
        >
          {songList.map((songKey) => (
            <option key={songKey} value={songKey}>
              {
                // eslint-disable-next-line import-x/namespace
                songs[songKey].title
              }
            </option>
          ))}
        </select>
      </label>
      <label className={formStyles.inputLabel}>
        <span>Channel 1:</span>
        <textarea
          rows={3}
          disabled={playing}
          value={channel1}
          onChange={(e) => {
            setChannel1(e.target.value);
          }}
        />
      </label>
      <label className={formStyles.inputLabel}>
        <span>Channel 2:</span>
        <textarea
          rows={3}
          disabled={playing}
          value={channel2}
          onChange={(e) => {
            setChannel2(e.target.value);
          }}
        />
      </label>
      <div className="grid grid-cols-2 gap-6">
        <label className={formStyles.inputLabel}>
          <span>Beats Per Minute:</span>
          <input
            type="number"
            min={10}
            max={200}
            value={BPM}
            disabled={playing}
            onChange={(e) => {
              setBPM(parseInt(e.target.value, 10));
            }}
          />
        </label>
        <label className={formStyles.inputLabel}>
          <span>Motor Mode:</span>
          <input
            type="number"
            min={1}
            max={5}
            value={motorMode}
            disabled={playing}
            onChange={(e) => {
              setMotorMode(parseInt(e.target.value, 10));
            }}
          />
        </label>
      </div>
      <label className={formStyles.checkboxLabel}>
        <input
          type="checkbox"
          disabled={playing}
          checked={penDown}
          onChange={(e) => {
            setPenDown(e.target.checked);
          }}
        />{' '}
        <span>PenDown</span>
      </label>
      <Button
        variant="default"
        type={playing ? 'button' : 'submit'}
        onClick={() => {
          if (playing) {
            vPRGRef.current = true;
          }
        }}
      >
        {playing ? 'Stop' : 'Play'}
      </Button>
      <Alert variant="default">
        <ToggleLeft className="h-4 w-4" />
        <AlertTitle>Tip</AlertTitle>
        <AlertDescription>
          You could also press the PRG button on device to stop playing.
        </AlertDescription>
      </Alert>
      <label className={formStyles.inputLabel}>
        <span>Results:</span>
        <textarea rows={3} defaultValue={results} readOnly />
      </label>
    </form>
  );
};

export default MidiCommander;
