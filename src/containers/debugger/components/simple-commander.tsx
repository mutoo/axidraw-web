import type { ChangeEvent, SubmitEvent } from 'react';
import { useCallback, useState } from 'react';
import type { IDeviceConnector } from '@/communication/device/device';
import * as commands from '@/communication/ebb';
import type { Command } from '@/communication/ebb/command';
import { checkVersion } from '@/communication/ebb/utils';
import { Button } from '@/components/ui/button';
import formStyles from '@/components/ui/form.module.css';
import { trackEvent } from '../utils';

type CommandsType = typeof commands;
type CommandId = keyof CommandsType;
const commandList: CommandId[] = Object.keys(commands) as CommandId[];

// ebb.html documents firmware v3.0+, ebb2.html the v1.8.0 - v2.8.1 command set
const docsUrl = (version: string) =>
  `https://evil-mad.github.io/EggBot/${checkVersion(version, '3.0.0') ? 'ebb' : 'ebb2'}.html`;

const SimpleCommander = ({ device }: { device: IDeviceConnector<unknown> }) => {
  const [cmd, setCmd] = useState<CommandId>('r');
  const [params, setParams] = useState('');
  const [paramsHistory, setParamsHistory] = useState<Record<string, string>>(
    {},
  );
  const [result, setResult] = useState('');
  const sendCommand = useCallback(
    (e: SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      void (async () => {
        trackEvent('simple', cmd);
        try {
          const paramsStr = params.trim();
          setParamsHistory({ ...paramsHistory, [cmd]: paramsStr });
          setParams(paramsStr);
          // eslint-disable-next-line import-x/namespace
          const command = commands[cmd] as Command<unknown[], unknown>;
          const cmdResult = await device.executeCommand(
            command,
            ...command.parseParams(paramsStr),
          );
          setResult(JSON.stringify(cmdResult));
        } catch (err) {
          setResult(String(err));
        }
      })();
    },
    [device, cmd, params, paramsHistory],
  );
  return (
    <form className={formStyles.root} onSubmit={sendCommand}>
      <h3>Simple Commander</h3>
      <p>Send simple command to device.</p>
      <label className={formStyles.inputLabel}>
        <span>Command:</span>
        <select
          defaultValue={cmd}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            const nextCmd = e.target.value as CommandId;
            setCmd(nextCmd);
            setParams(paramsHistory[nextCmd] ?? '');
          }}
        >
          {commandList.map((cmdKey) => (
            <option key={cmdKey} value={cmdKey}>
              {
                // eslint-disable-next-line import-x/namespace
                commands[cmdKey].title
              }
            </option>
          ))}
        </select>
      </label>
      <label className={formStyles.inputLabel}>
        <span>
          Params
          <a
            // eslint-disable-next-line import-x/namespace
            href={`${docsUrl(device.version)}#${commands[cmd].cmd}`}
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
          onChange={(e) => {
            setParams(e.target.value);
          }}
        />
      </label>
      <Button type="submit">Send</Button>
      <label className={formStyles.inputLabel}>
        <span>Result:</span>
        <textarea rows={3} defaultValue={result} readOnly />
      </label>
    </form>
  );
};

export default SimpleCommander;
