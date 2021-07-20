import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import * as commands from 'communication/ebb';
import formStyles from 'components/ui/form.css';
import Button from 'components/ui/button/button';

const BatchCommander = ({ device }) => {
  const [batch, setBatch] = useState('');
  const [results, setResults] = useState('');
  const sendCommands = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        const CMDs = batch.trim().split(/\s+/);
        let resultStr = '';
        for (const cmdWithParams of CMDs) {
          // eslint-disable-next-line no-continue
          if (cmdWithParams.startsWith('#')) continue;
          const parts = cmdWithParams.split(',');
          const cmd = parts.shift().toLowerCase();
          // there commands or not concurrent, their are executed one-by-one.
          // eslint-disable-next-line no-await-in-loop
          const result = await device.executeCommand(commands[cmd], ...parts);
          if (typeof result === 'object') {
            resultStr += JSON.stringify(result);
          } else {
            resultStr += result;
          }
          resultStr += '\n';
        }
        setResults(resultStr);
      } catch (err) {
        setResults(err.toString());
      }
    },
    [device, batch],
  );
  return (
    <form className={formStyles.root} onSubmit={sendCommands}>
      <h3>Batch Commander</h3>
      <p>Send batch commands to device.</p>
      <label className={formStyles.inputLabel}>
        <span>Commands:</span>
        <textarea
          rows="3"
          defaultValue={batch}
          onChange={(e) => setBatch(e.target.value)}
        />
      </label>
      <Button type="submit">Send</Button>
      <label className={formStyles.inputLabel}>
        <span>Results:</span>
        <textarea rows="3" defaultValue={results} readOnly />
      </label>
    </form>
  );
};

BatchCommander.propTypes = {
  device: PropTypes.object.isRequired,
};

export default BatchCommander;
