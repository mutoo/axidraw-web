import { useCallback, useState } from 'react';
import { IDeviceConnector } from '@/communication/device/device';
import * as commands from '@/communication/ebb';
import { Command, CommandWithParams } from '@/communication/ebb/command';
import Button from '@/components/ui/button/button';
import formStyles from '@/components/ui/form.module.css';
import { trackEvent } from '../utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const frequentlyCommands: CommandWithParams<Command<any, unknown>>[] = [
  {
    cmd: commands.r,
    title: 'Reset',
    params: [],
  },
  {
    cmd: commands.v,
    title: 'Get version',
    params: [],
  },
  {
    cmd: commands.qb,
    title: 'Query button',
    params: [],
  },
  {
    cmd: commands.tp,
    title: 'Toggle pen',
    params: [],
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

const FavCommander = ({ device }: { device: IDeviceConnector<unknown> }) => {
  const [result, setResult] = useState('');
  const sendCommand = useCallback(
    async <T extends unknown[], R>(cmd: Command<T, R>, params: T) => {
      trackEvent('fav', cmd.title);
      try {
        const cmdResult = await device.executeCommand(cmd, ...params);
        setResult(JSON.stringify(cmdResult));
      } catch (err) {
        setResult(String(err));
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
              onClick={() => {
                void sendCommand(cmd.cmd, cmd.params);
              }}
            >
              {title}
            </Button>
          );
        })}
      </div>
      <label className={formStyles.inputLabel}>
        <span>Result:</span>
        <textarea rows={3} defaultValue={result} readOnly />
      </label>
    </form>
  );
};

export default FavCommander;
