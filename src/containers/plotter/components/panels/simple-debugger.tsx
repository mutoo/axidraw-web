import { reaction } from 'mobx';
import { useCallback, useContext, useEffect, useState } from 'react';
import { IDeviceConnector } from '@/communication/device/device';
import * as commands from '@/communication/ebb';
import { Command } from '@/communication/ebb/command';
import Alert from '@/components/ui/alert/alert';
import Button from '@/components/ui/button/button';
import formStyles from '@/components/ui/form.module.css';
import { PlotterContext } from '../../context';
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

const SimpleDebugger = ({ device }: { device: IDeviceConnector<unknown> }) => {
  const { work } = useContext(PlotterContext);
  const [result, setResult] = useState('');
  const sendCommand = useCallback(
    async (cmd: Command<unknown>, params: unknown[] = []) => {
      try {
        const cmdResult = await device.executeCommand(cmd, ...params);
        if (typeof cmdResult === 'object') {
          setResult(JSON.stringify(cmdResult));
        } else {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          setResult(String(cmdResult));
        }
      } catch (err) {
        setResult(String(err));
      }
    },
    [device],
  );
  useEffect(() => {
    const dispose = reaction(
      () => ({
        servoMin: work.servoMin.get(),
        servoMax: work.servoMax.get(),
        servoRate: work.servoRate.get(),
      }),
      ({ servoMin, servoMax, servoRate }) => {
        void (async () => {
          if (device.isConnected) {
            await device.executeCommand(commands.sc, 4, servoMin);
            await device.executeCommand(commands.sc, 5, servoMax);
            await device.executeCommand(commands.sc, 10, servoRate);
          }
        })();
      },
    );
    return () => {
      dispose();
    };
  }, []);

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
                void sendCommand(cmd.cmd, cmd.params);
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
        <textarea rows={3} defaultValue={result} readOnly />
      </label>
    </form>
  );
};

export default SimpleDebugger;