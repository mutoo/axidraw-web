import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import * as commands from 'communication/ebb';
import formStyles from 'components/ui/form.css';
import Button from 'components/ui/button/button';

const frequentlyCommands = [
  {
    cmd: commands.r,
  },
  {
    cmd: commands.v,
  },
  {
    cmd: commands.qb,
  },
  {
    cmd: commands.tp,
  },
  {
    cmd: commands.sp,
    title: 'Pen up',
    params: [1],
  },
  {
    cmd: commands.sp,
    title: 'Pen down',
    params: [0],
  },
  {
    cmd: commands.em,
    title: 'Enable motor',
    params: [1, 1],
  },
  {
    cmd: commands.em,
    title: 'Disable motor',
    params: [0, 0],
  },
];

const FavCommander = ({ device }) => {
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
      <h3>Fav Commander</h3>
      <p>Send frequently used command to device.</p>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {frequentlyCommands.map((cmd) => {
          const title = cmd.title || cmd.cmd.title;
          return (
            <Button
              key={title}
              type="button"
              onClick={() => {
                sendCommand(cmd.cmd, cmd.params);
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

FavCommander.propTypes = {
  device: PropTypes.object.isRequired,
};

export default FavCommander;
