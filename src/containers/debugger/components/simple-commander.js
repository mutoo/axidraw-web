import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import * as commands from 'communication/ebb';
import formStyles from 'components/ui/form.css';
import Button from 'components/ui/button/button';

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
      try {
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
      } catch (err) {
        setResult(err.toString());
      }
    },
    [device, cmd, params, paramsHistory],
  );
  return (
    <form className={formStyles.root} onSubmit={sendCommand}>
      <h3>Simple Commander</h3>
      <p>Send simple command to device.</p>
      <label className={formStyles.inputLabel}>
        <span>Command:</span>
        <select defaultValue={cmd} onChange={(e) => setCmd(e.target.value)}>
          {commandList.map((cmdKey) => (
            <option key={cmdKey} value={cmdKey}>
              {commands[cmdKey].title}
            </option>
          ))}
        </select>
      </label>
      <label className={formStyles.inputLabel}>
        <span>
          Params
          <a
            href={`http://evil-mad.github.io/EggBot/ebb.html#${commands[cmd].cmd}`}
            target="_blank"
            rel="noreferrer"
          >
            [?]
          </a>
          :
        </span>
        <input
          type="text"
          value={params}
          onChange={(e) => setParams(e.target.value)}
        />
      </label>
      <Button type="submit">Send</Button>
      <label className={formStyles.inputLabel}>
        <span>Result:</span>
        <textarea rows="3" defaultValue={result} readOnly />
      </label>
    </form>
  );
};

SimpleCommander.propTypes = {
  device: PropTypes.object.isRequired,
};

export default SimpleCommander;
