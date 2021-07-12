import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import formStyles from 'components/ui/form.css';
import { composeSong, parseNote } from 'containers/composer/utils';
import * as songs from '../songs';

const songList = Object.keys(songs);

const MidiCommander = ({ device }) => {
  const [songName, setSongName] = useState(songList[0]);
  const [channel1, setChannel1] = useState('');
  const [channel2, setChannel2] = useState('');
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
      // eslint-disable-next-line no-unused-vars
      const mixChannel = composeSong({
        channel1: channel1.split(', ').map(parseNote),
        channel2: channel2.split(', ').map(parseNote),
      });
      setResults('');
    },
    [device, channel1, channel2],
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
          defaultValue={channel1}
          onChange={(e) => setChannel1(e.target.value)}
        />
      </label>
      <label className={formStyles.inputLabel}>
        <span>Channel 2:</span>
        <textarea
          rows="3"
          defaultValue={channel2}
          onChange={(e) => setChannel2(e.target.value)}
        />
      </label>
      <button type="submit">Play</button>
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
