import { Dices, Info, ToggleLeft, TriangleAlert } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import type { IDeviceConnector } from '@/communication/device/device';
import DeviceConnector from '@/components/device-connector/device-connector';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import formStyles from '@/components/ui/form.module.css';
import { useIdleTimeout } from '@/hooks/idle-timeout';
import type { PageSize } from '@/plotter/page-sizes';
import { randomSeed } from '@/utils/random';
import type { PlayerStage } from '../player';
import play from '../player';
import { parseSongFile, SONG_FILE_EXTENSION } from '../song-file';
import * as songs from '../songs';
import type { Placement } from '../stage';
import { checkPadding, placeSong } from '../stage';
import type { RawSong } from '../utils';
import {
  DEFAULT_BPM,
  formatChannel,
  logger,
  MAX_BPM,
  MIN_BPM,
  parseSong,
  songToSteps,
  trackEvent,
} from '../utils';
import SongDropzone from './song-dropzone';
import SongPreview from './song-preview';

type SongsType = typeof songs;
type SongId = keyof SongsType;
const songList = Object.keys(songs) as SongId[];
// eslint-disable-next-line import-x/namespace
const getSong = (songId: SongId): RawSong => songs[songId];

const stageLabels: Record<PlayerStage, string> = {
  travelling: 'Moving to the middle of the page…',
  playing: 'Playing…',
  returning: 'Going back to the origin…',
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

// a song loaded from a file is picked by its title, after this
const LOADED = 'loaded:';

// how long the device stays connected with nothing done, so it is free for
// others: longer while no song has played yet, shorter once one has
const IDLE_BEFORE_SONG = { ms: 5 * 60 * 1000, label: '5 minutes' };
const IDLE_AFTER_SONG = { ms: 60 * 1000, label: 'a minute' };

/**
 * Reads song files, or says which one stops them from loading.
 */
const readSongFiles = (files: File[]) =>
  Promise.all(
    files.map(async (file) => {
      if (!file.name.toLowerCase().endsWith(SONG_FILE_EXTENSION)) {
        throw new Error(`${file.name} is not a ${SONG_FILE_EXTENSION} file.`);
      }
      try {
        return parseSongFile(await file.text());
      } catch (e) {
        throw new Error(`${file.name}: ${errorMessage(e)}`, { cause: e });
      }
    }),
  );

/**
 * Plans where the pen goes for the song, or says what stops it from playing.
 */
const placeOnPage = ({
  channel1,
  channel2,
  BPM,
  motorMode,
  randomness,
  swapChance,
  seed,
  pageSize,
  padding,
}: {
  channel1: string;
  channel2: string;
  BPM: number;
  motorMode: number;
  // as percentages
  randomness: number;
  swapChance: number;
  seed: number;
  pageSize: PageSize;
  padding: number;
}): { placement: Placement; barlines: number } | { problem: string } => {
  if (!(BPM >= MIN_BPM && BPM <= MAX_BPM)) {
    return {
      problem: `Beats per minute should be from ${MIN_BPM} to ${MAX_BPM}.`,
    };
  }
  if (!(motorMode >= 1 && motorMode <= 5)) {
    return { problem: 'Motor mode should be from 1 to 5.' };
  }
  if (!(Number.isInteger(seed) && seed >= 0)) {
    return { problem: 'Seed should be a whole number.' };
  }
  const paddingProblem = checkPadding(pageSize, padding);
  if (paddingProblem) {
    return { problem: paddingProblem };
  }
  try {
    const song = parseSong(channel1, channel2);
    return {
      placement: placeSong(songToSteps(song, BPM), {
        page: pageSize,
        padding,
        motorMode,
        randomness: randomness / 100,
        swapChance: swapChance / 100,
        seed,
      }),
      barlines: song.barlines?.length ?? 0,
    };
  } catch (e) {
    return { problem: errorMessage(e) };
  }
};

const MidiCommander = ({
  pageSize,
  orientation,
  padding,
  playing,
  setPlaying,
}: {
  pageSize: PageSize;
  orientation: string;
  padding: number;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
}) => {
  const [channel1, setChannel1] = useState(() =>
    formatChannel(getSong(songList[0]).channel1),
  );
  const [channel2, setChannel2] = useState(() =>
    formatChannel(getSong(songList[0]).channel2),
  );
  const [BPM, setBPM] = useState(() => getSong(songList[0]).bpm ?? DEFAULT_BPM);
  const [songId, setSongId] = useState<string>(songList[0]);
  // songs from files, which the Song list shows after its own
  const [loaded, setLoaded] = useState<RawSong[]>([]);
  const [loadProblem, setLoadProblem] = useState<string | null>(null);
  const [motorMode, setMotorMode] = useState(1);
  const [penDown, setPenDown] = useState(false);
  const [randomness, setRandomness] = useState(30);
  // whether, and how likely, the channels trade motors at a bar line
  const [swapAtBars, setSwapAtBars] = useState(false);
  const [swapChance, setSwapChance] = useState(50);
  const [seed, setSeed] = useState(randomSeed);
  const [stage, setStage] = useState<PlayerStage | null>(null);
  const stopRequestedRef = useRef(false);
  const [results, setResults] = useState('');
  const [device, setDevice] = useState<IDeviceConnector<unknown> | null>(null);
  // whether a song has played since the device connected
  const [played, setPlayed] = useState(false);
  // how long the device was left idle, once it was disconnected for that
  const [idleDisconnected, setIdleDisconnected] = useState<string | null>(null);
  const onConnected = useCallback((connected: IDeviceConnector<unknown>) => {
    setDevice(connected);
    setPlayed(false);
    setIdleDisconnected(null);
  }, []);
  const onDisconnected = useCallback(() => {
    setDevice(null);
  }, []);
  const idle = played ? IDLE_AFTER_SONG : IDLE_BEFORE_SONG;
  useIdleTimeout(device !== null && !playing, idle.ms, () => {
    logger.info('Disconnect the idle device');
    setIdleDisconnected(idle.label);
    void device?.disconnectDevice();
  });
  const placed = placeOnPage({
    channel1,
    channel2,
    BPM,
    motorMode,
    randomness,
    swapChance: swapAtBars ? swapChance : 0,
    seed,
    pageSize,
    padding,
  });

  const showSong = (id: string, song: RawSong) => {
    setSongId(id);
    setChannel1(formatChannel(song.channel1));
    setChannel2(formatChannel(song.channel2));
    setBPM(song.bpm ?? DEFAULT_BPM);
  };

  const loadSongs = (files: File[]) => {
    if (!files.length) return;
    trackEvent('load song');
    readSongFiles(files)
      .then((read) => {
        // a song loaded again takes the place of the one with its title
        setLoaded((before) => {
          const byTitle = new Map(before.map((song) => [song.title, song]));
          for (const song of read) byTitle.set(song.title, song);
          return [...byTitle.values()];
        });
        const last = read[read.length - 1];
        showSong(LOADED + last.title, last);
        setLoadProblem(null);
      })
      .catch((err: unknown) => {
        setLoadProblem(errorMessage(err));
      });
  };

  const startPlaying = (device: IDeviceConnector<unknown>) => {
    if (playing || !('placement' in placed)) return;
    const { start, moves } = placed.placement;
    trackEvent('play');
    logger.info('Start playing song');
    stopRequestedRef.current = false;
    setResults('');
    setPlaying(true);
    void play({
      device,
      start,
      moves,
      motorMode,
      penDown,
      isStopRequested: () => stopRequestedRef.current,
      onStage: setStage,
    })
      .then(() => {
        logger.info('Song finished');
      })
      .catch((err: unknown) => {
        setResults(errorMessage(err));
      })
      .finally(() => {
        setStage(null);
        setPlaying(false);
        setPlayed(true);
      });
  };

  return (
    <div className={formStyles.root}>
      <h3>Song</h3>
      <p>Pick or compose a song, and preview how the pen moves on the page.</p>
      <label className={formStyles.inputLabel}>
        <span>Song:</span>
        <select
          value={songId}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            const id = e.target.value;
            const song = id.startsWith(LOADED)
              ? loaded.find(({ title }) => LOADED + title === id)
              : getSong(id as SongId);
            if (song) showSong(id, song);
          }}
          disabled={playing}
        >
          {songList.map((songKey) => (
            <option key={songKey} value={songKey}>
              {getSong(songKey).title}
            </option>
          ))}
          {loaded.length > 0 && (
            <optgroup label="Loaded from files">
              {loaded.map(({ title }) => (
                <option key={title} value={LOADED + title}>
                  {title}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </label>
      <SongDropzone disabled={playing} onFiles={loadSongs} />
      {loadProblem && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Can not load the song</AlertTitle>
          <AlertDescription>{loadProblem}</AlertDescription>
        </Alert>
      )}
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
            min={MIN_BPM}
            max={MAX_BPM}
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
      <div className="grid grid-cols-2 gap-6">
        <label className={formStyles.inputLabel}>
          <span>Randomness: {randomness}%</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={randomness}
            disabled={playing}
            onChange={(e) => {
              setRandomness(parseInt(e.target.value, 10));
            }}
          />
        </label>
        <div className={formStyles.inputLabel}>
          <span>Seed:</span>
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1"
              type="number"
              min={0}
              aria-label="Seed"
              value={seed}
              disabled={playing}
              onChange={(e) => {
                setSeed(parseInt(e.target.value, 10));
              }}
            />
            <Button
              type="button"
              variant="secondary"
              title="Try another seed"
              aria-label="Try another seed"
              disabled={playing}
              onClick={() => {
                setSeed(randomSeed());
              }}
            >
              <Dices className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 items-end gap-6">
        <label className={formStyles.checkboxLabel}>
          <input
            type="checkbox"
            disabled={playing}
            checked={swapAtBars}
            onChange={(e) => {
              setSwapAtBars(e.target.checked);
            }}
          />
          <span>Swap channels at bars</span>
        </label>
        <label className={formStyles.inputLabel}>
          <span>Swap chance: {swapChance}%</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={swapChance}
            disabled={playing || !swapAtBars}
            onChange={(e) => {
              setSwapChance(parseInt(e.target.value, 10));
            }}
          />
        </label>
      </div>
      {'problem' in placed ? (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Can not play</AlertTitle>
          <AlertDescription>{placed.problem}</AlertDescription>
        </Alert>
      ) : (
        <>
          <SongPreview
            pageSize={pageSize}
            orientation={orientation}
            padding={padding}
            placement={placed.placement}
          />
          {placed.placement.midNoteTurns > 0 ? (
            <Alert variant="default">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>Tight on the page</AlertTitle>
              <AlertDescription>
                To stay inside the padding, the pen turns back part-way through
                a note {placed.placement.midNoteTurns} times. Lower the motor
                mode or the padding to hear every note as written.
              </AlertDescription>
            </Alert>
          ) : (
            <p className="text-sm text-muted-foreground">
              With seed {seed}, the pen moves within{' '}
              {placed.placement.width.toFixed(0)} ×{' '}
              {placed.placement.height.toFixed(0)} mm and keeps to the shaded
              area.
              {swapAtBars &&
                (placed.barlines > 0
                  ? ` The channels swap at ${placed.placement.swaps} of ${placed.barlines} bar lines.`
                  : ' Put | between the bars of the notes to let the channels swap there.')}
            </p>
          )}
        </>
      )}
      <DeviceConnector
        onConnected={onConnected}
        onDisconnected={onDisconnected}
      />
      {!device && idleDisconnected && (
        <Alert variant="default">
          <Info className="h-4 w-4" />
          <AlertTitle>Disconnected</AlertTitle>
          <AlertDescription>
            The device was left idle for {idleDisconnected}, so it was
            disconnected. Connect again to play a song.
          </AlertDescription>
        </Alert>
      )}
      {device && (
        <>
          <Button
            variant="default"
            disabled={
              stage === 'returning' || (!playing && 'problem' in placed)
            }
            onClick={() => {
              if (playing) {
                stopRequestedRef.current = true;
                trackEvent('stop');
              } else {
                startPlaying(device);
              }
            }}
          >
            {playing ? 'Stop' : 'Play'}
          </Button>
          {stage && (
            <p className="text-center text-sm text-muted-foreground">
              {stageLabels[stage]}
            </p>
          )}
          {!playing && (
            <p className="text-center text-sm text-muted-foreground">
              The device disconnects after {idle.label} with nothing done.
            </p>
          )}
          <Alert variant="default">
            <ToggleLeft className="h-4 w-4" />
            <AlertTitle>Tip</AlertTitle>
            <AlertDescription>
              You could also press the PRG button on device to stop playing. The
              pen goes back to the origin either way.
            </AlertDescription>
          </Alert>
          <label className={formStyles.inputLabel}>
            <span>Results:</span>
            <textarea rows={3} value={results} readOnly />
          </label>
        </>
      )}
    </div>
  );
};

export default MidiCommander;
