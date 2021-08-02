import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import formStyles from 'components/ui/form.css';
import Button from 'components/ui/button/button';
import Alert from 'components/ui/alert/alert';
import * as commands from 'communication/ebb';
import { delay } from 'utils/time';
import { parseNote, planSteps, songToSteps, trackEvent } from '../utils';
import * as songs from '../songs';

const songList = Object.keys(songs);

const MidiCommander = ({ device }) => {
  const [songName, setSongName] = useState(songList[0]);
  const [channel1, setChannel1] = useState('');
  const [channel2, setChannel2] = useState('');
  const [BPM, setBPM] = useState(88);
  const [motorMode, setMotorMode] = useState(1);
  const [penDown, setPenDown] = useState(false);
  const [playing, setPlaying] = useState(false);
  const vPRG = useRef(false);
  const [results, setResults] = useState('');
  useEffect(() => {
    const song = songs[songName];
    if (song) {
      setChannel1(song.channel1.join(', '));
      setChannel2(song.channel2.join(', '));
    }
  }, [songName]);
  const sendCommands = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        trackEvent('play');
        // eslint-disable-next-line no-unused-vars
        const steps = songToSteps(
          {
            channel1: channel1.split(', ').filter(Boolean).map(parseNote),
            channel2: channel2.split(', ').filter(Boolean).map(parseNote),
          },
          BPM,
        );
        setPlaying(true);
        // set home
        await device.executeCommand(commands.r);
        await device.executeCommand(commands.em, motorMode, motorMode);
        await device.executeCommand(commands.sp, penDown ? 0 : 1, 500);
        /* eslint-disable no-await-in-loop */
        for (const step of planSteps(steps, { model: 'v3' })) {
          const shouldStop = await device.executeCommand(commands.qb);
          if (shouldStop || vPRG.current) {
            // eslint-disable-next-line no-await-in-loop
            await device.executeCommand(commands.r);
            await device.executeCommand(commands.sp, 1, 500);
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
        /* eslint-enable no-await-in-loop */
        await device.executeCommand(commands.sp, 1, 500);
        await delay(2000);
        const st = await device.executeCommand(commands.qs);
        const dist = Math.sqrt(st.a1 ** 2 + st.a2 ** 2);
        const homeStepFreq = 1000;
        const homeDuration = (dist / homeStepFreq) * 1000;
        await device.executeCommand(commands.hm, homeStepFreq);
        await delay(homeDuration);
        await device.executeCommand(commands.r);
      } catch (err) {
        setResults(err.toString());
      } finally {
        setPlaying(false);
      }
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
          onChange={(e) => setSongName(e.target.value)}
          disabled={playing}
        >
          {songList.map((songKey) => (
            <option key={songKey} value={songKey}>
              {songs[songKey].title}
            </option>
          ))}
        </select>
      </label>
      <label className={formStyles.inputLabel}>
        <span>Channel 1:</span>
        <textarea
          rows="3"
          disabled={playing}
          value={channel1}
          onChange={(e) => setChannel1(e.target.value)}
        />
      </label>
      <label className={formStyles.inputLabel}>
        <span>Channel 2:</span>
        <textarea
          rows="3"
          disabled={playing}
          value={channel2}
          onChange={(e) => setChannel2(e.target.value)}
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
            onChange={(e) => setBPM(e.target.value)}
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
            onChange={(e) => setMotorMode(e.target.value)}
          />
        </label>
      </div>
      <label className={formStyles.checkboxLabel}>
        <input
          type="checkbox"
          disabled={playing}
          checked={penDown}
          onChange={(e) => setPenDown(e.target.checked)}
        />{' '}
        <span>PenDown</span>
      </label>
      <Button
        variant="primary"
        type={playing ? 'button' : 'submit'}
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
        <textarea rows="3" defaultValue={results} readOnly />
      </label>
    </form>
  );
};

MidiCommander.propTypes = {
  device: PropTypes.object.isRequired,
};

export default MidiCommander;
