import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import debuggerStyles from 'containers/debugger/debugger.css';
import * as commands from 'communication/ebb';
import styles from './simple-commander.css';

const commandList = Object.keys(commands);

const SimpleCommander = ({ device }) => {
  const [cmd, setCmd] = useState('r');
  const [params, setParams] = useState('');
  const [paramsHistory, setParamsHistory] = useState({});
  const [result, setResult] = useState('');
  useEffect(() => {
    setParams(paramsHistory[cmd] ?? '');
  }, [cmd]);
  const sendCommand = useCallback(
    async (e) => {
      e.preventDefault();
      const paramsStr = params.trim();
      setParamsHistory({ ...paramsHistory, [cmd]: paramsStr });
      const cmdParams = paramsStr === '' ? [] : paramsStr.split(',');
      const cmdResult = await device.executeCommand(
        commands[cmd],
        ...cmdParams,
      );
      if (typeof cmdResult === 'object') {
        setResult(JSON.stringify(cmdResult));
      } else {
        setResult(cmdResult);
      }
    },
    [device, cmd, params, paramsHistory],
  );
  return (
    <form className={styles.form} onSubmit={sendCommand}>
      <h3>Simple Commander</h3>
      <p>Send simple command to device.</p>
      <label className={debuggerStyles.inputLabel}>
        <span>Command:</span>
        <select defaultValue={cmd} onChange={(e) => setCmd(e.target.value)}>
          {commandList.map((cmdKey) => (
            <option key={cmdKey} value={cmdKey}>
              {commands[cmdKey].title}
            </option>
          ))}
        </select>
      </label>
      <label className={debuggerStyles.inputLabel}>
        <span>Params:</span>
        <input
          type="text"
          value={params}
          onChange={(e) => setParams(e.target.value)}
        />
      </label>
      <button type="submit">Send</button>
      <label className={debuggerStyles.inputLabel}>
        <span>Result:</span>
        <textarea rows="3" defaultValue={result} />
      </label>
    </form>
  );
};

SimpleCommander.propTypes = {
  device: PropTypes.object.isRequired,
};

export default SimpleCommander;
