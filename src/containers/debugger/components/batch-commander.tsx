import { FormEvent, useCallback, useState } from 'react';
import { IDeviceConnector } from '@/communication/device/device';
import * as commands from '@/communication/ebb';
import { Command } from '@/communication/ebb/command';
import Button from '@/components/ui/button/button';
import formStyles from '@/components/ui/form.module.css';
import { trackEvent } from '../utils';

const BatchCommander = ({ device }: { device: IDeviceConnector<unknown> }) => {
  const [batch, setBatch] = useState('');
  const [results, setResults] = useState('');
  const sendCommands = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      void (async () => {
        try {
          trackEvent('batch');
          const CMDs = batch.trim().split(/\s+/);
          let resultStr = '';
          for (const cmdWithParams of CMDs) {
            // skip comments
            if (cmdWithParams.startsWith('#')) continue;
            const parts = cmdWithParams.split(',');
            const maybeCmd = parts.shift();
            if (!maybeCmd) continue;
            const cmdId = maybeCmd as keyof typeof commands;
            const params = parts.join(',');
            // eslint-disable-next-line import/namespace
            const command = commands[cmdId] as Command<unknown[], unknown>;
            // there commands are not concurrent, their are executed one-by-one.
            const result = await device.executeCommand(
              command,
              command.parseParams(params),
            );
            resultStr += JSON.stringify(result);
            resultStr += '\n';
          }
          setResults(resultStr);
        } catch (err) {
          setResults(String(err));
        }
      });
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
          rows={3}
          defaultValue={batch}
          onChange={(e) => {
            setBatch(e.target.value);
          }}
        />
      </label>
      <Button submit>Send</Button>
      <label className={formStyles.inputLabel}>
        <span>Results:</span>
        <textarea rows={3} defaultValue={results} readOnly />
      </label>
    </form>
  );
};

export default BatchCommander;
