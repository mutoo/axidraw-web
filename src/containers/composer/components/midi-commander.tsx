import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { IDeviceConnector } from '@/communication/device/device';
import * as commands from '@/communication/ebb';
import Alert from '@/components/ui/alert/alert';
import Button from '@/components/ui/button/button';
import formStyles from '@/components/ui/form.module.css';
import { delay } from '@/utils/time';
import * as songs from '../songs';
import {
  parseNote,
  planSteps,
  RawSong,
  songToSteps,
  trackEvent,
  logger,
} from '../utils';

type SongsType = typeof songs;
type SongId = keyof SongsType;
const songList = Object.keys(songs) as SongId[];

const MidiCommander = ({ device }: { device: IDeviceConnector<unknown> }) => {
  const [songName, setSongName] = useState<SongId>(songList[0]);
  const [channel1, setChannel1] = useState('');
  const [channel2, setChannel2] = useState('');
  const [BPM, setBPM] = useState(88);
  const [motorMode, setMotorMode] = useState(1);
  const [penDown, setPenDown] = useState(false);
  const [playing, setPlaying] = useState(false);
  const vPRG = useRef(false);
  const [results, setResults] = useState('');
  useEffect(() => {
    // eslint-disable-next-line import/namespace
    const song: RawSong | undefined = songs[songName];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (song) {
      setChannel1(song.channel1.join(', '));
      setChannel2(song.channel2.join(', '));
    }
  }, [songName]);
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
            if (shouldStop || vPRG.current) {
              await device.executeCommand(commands.r);
              await device.executeCommand(commands.sp, 1, 500, undefined);
              vPRG.current = false;
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
          defaultValue={songName}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            setSongName(e.target.value as SongId);
          }}
          disabled={playing}
        >
          {songList.map((songKey) => (
            <option key={songKey} value={songKey}>
              {
                // eslint-disable-next-line import/namespace
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
        variant="primary"
        submit={!playing}
        onClick={() => {
          if (playing) {
            vPRG.current = true;
          }
        }}
      >
        {playing ? 'Stop' : 'Play'}
      </Button>
      <Alert type="info">
        Tip: You could also press the PRG button on device to stop playing.
      </Alert>
      <label className={formStyles.inputLabel}>
        <span>Results:</span>
        <textarea rows={3} defaultValue={results} readOnly />
      </label>
    </form>
  );
};

export default MidiCommander;
