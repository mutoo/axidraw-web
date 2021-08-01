import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import * as commands from 'communication/ebb';
import formStyles from 'components/ui/form.css';
import Button from 'components/ui/button/button';
import Alert from 'components/ui/alert/alert';
import { trackEvent } from '../../utils';

const frequentlyCommands = [
  {
    cmd: commands.r,
  },
  {
    cmd: commands.em,
    title: 'Disable Motor',
    params: [0, 0],
  },
  {
    cmd: commands.tp,
  },
  {
    cmd: commands.sp,
    title: 'Pen Up',
    params: [1],
  },
  {
    cmd: commands.sp,
    title: 'Pen Down',
    params: [0],
  },
];

const SimpleDebugger = ({ device }) => {
  const [result, setResult] = useState('');
  const sendCommand = useCallback(
    async (cmd, params = []) => {
      try {
        const cmdResult = await device.executeCommand(cmd, ...params);
        if (typeof cmdResult === 'object') {
          setResult(JSON.stringify(cmdResult));
        } else {
          setResult(cmdResult);
        }
      } catch (err) {
        setResult(err.toString());
      }
    },
    [device],
  );
  return (
    <form className={formStyles.root}>
      <h3>Simple Debugger</h3>
      <Alert type="info">Debug AxiDraw before plotting here.</Alert>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        {frequentlyCommands.map((cmd) => {
          const title = cmd.title || cmd.cmd.title;
          return (
            <Button
              key={title}
              onClick={() => {
                sendCommand(cmd.cmd, cmd.params);
                trackEvent('debug', title);
              }}
            >
              {title}
            </Button>
          );
        })}
      </div>
      <label className={formStyles.inputLabel}>
        <span>Result:</span>
        <textarea rows="3" defaultValue={result} readOnly />
      </label>
    </form>
  );
};

SimpleDebugger.propTypes = {
  device: PropTypes.object.isRequired,
};

export default SimpleDebugger;
