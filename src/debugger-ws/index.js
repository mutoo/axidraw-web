import {
  checkDevice,
  connectDevice,
  disconnectDevice,
  executeCommand,
} from '../websocket.js';
import * as commands from '../ebb/index.js';
import { delay } from '../ebb/utils.js';

const paramsHistory = {};

const debugTxt = document.getElementById('debug-txt');
window.addEventListener('unhandledrejection', (e) => {
  debugTxt.value = e.reason;
});

const wsAddress = document.getElementById('ws-address');

const connectBtn = document.getElementById('connect-btn');
connectBtn.addEventListener('click', async () => {
  try {
    const address = wsAddress.value;
    await connectDevice(address);
    await checkDevice();
    debugTxt.value = await executeCommand(commands.r);
  } catch (e) {
    throw new Error(`Can not connect to the EBB: ${e}`);
  }
});

const disconnectBtn = document.getElementById('disconnect-btn');
disconnectBtn.addEventListener('click', async () => {
  try {
    await executeCommand(commands.r);
    await disconnectDevice();
    debugTxt.value = 'Disconnected';
  } catch (e) {
    throw new Error(`Can not disconnect to the EBB: ${e.message}`);
  }
});

const cmdForm = document.getElementById('cmd-form');
cmdForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await checkDevice();
  } catch (_) {
    await connectDevice();
  }
  const cmd = cmdForm.cmd.value.trim().toLowerCase();
  const paramsStr = cmdForm.params.value.trim();
  paramsHistory[cmd] = paramsStr;
  const params = paramsStr === '' ? [] : paramsStr.split(',');
  const result = await executeCommand(commands[cmd], ...params);
  if (typeof result === 'object') {
    cmdForm.result.value = JSON.stringify(result);
  } else {
    cmdForm.result.value = result;
  }
});

const batchForm = document.getElementById('batch-form');
batchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await checkDevice();
  } catch (_) {
    await connectDevice();
  }
  const batch = batchForm.cmds.value.trim();
  const cmds = batch.split(/\s+/);
  debugTxt.value = '';
  for (const cmdWithParams of cmds) {
    const parts = cmdWithParams.split(',');
    const cmd = parts.shift().toLowerCase();
    // there commands or not concurrent, their are executed one-by-one.
    // eslint-disable-next-line no-await-in-loop
    const result = await executeCommand(commands[cmd], ...parts);
    if (typeof result === 'object') {
      debugTxt.value += JSON.stringify(result);
    } else {
      debugTxt.value += result;
    }
    debugTxt.value += '\n';
  }
});

const musicBtn = document.getElementById('music-btn');
musicBtn.addEventListener('click', async () => {
  const pitch = {
    B3: 247,
    C4: 262,
    D4: 294,
    E4: 330,
    F4: 349,
    G4: 392,
    A4: 440,
    B4: 494,
    C5: 523,
    D5: 587,
    E5: 659,
    F5: 698,
    G5: 784,
    A5: 880,
    B5: 988,
    C6: 1047,
  };
  const duration = {
    w: 4,
    h: 2,
    q: 1,
    e: 0.5,
    s: 0.25,
  };
  const notes = [
    ['qC5', 'qC5', 'qG5', 'qG5', 'qA5', 'qA5', 'hG5'],
    ['qF5', 'qF5', 'qE5', 'qE5', 'qD5', 'qD5', 'hC5'],
    ['qG5', 'qG5', 'qF5', 'qF5', 'qE5', 'qE5', 'hD5'],
    ['qG5', 'qG5', 'qF5', 'qF5', 'qE5', 'qE5', 'hD5'],
    ['qC5', 'qC5', 'qG5', 'qG5', 'qA5', 'qA5', 'hG5'],
    ['qF5', 'qF5', 'qE5', 'qE5', 'qD5', 'qD5', 'hC5'],
  ].flatMap((i) => i);
  const accomp = [
    [
      'eC4',
      'eG4',
      'eE4',
      'eG4',
      'eC4',
      'eG4',
      'eE4',
      'eG4',
      'eC4',
      'eA4',
      'eD4',
      'eA4',
      'eC4',
      'eG4',
      'eE4',
      'eG4',
    ],
    [
      'eC4',
      'eA4',
      'eD4',
      'eA4',
      'eC4',
      'eG4',
      'eE4',
      'eG4',
      'eA3',
      'eG4',
      'eD4',
      'eG4',
      'eC4',
      'eG4',
      'eE4',
      'eG4',
    ],
    [
      'eC4',
      'eG4',
      'eE4',
      'eG4',
      'eC4',
      'eA4',
      'eF4',
      'eA4',
      'eC3',
      'eG4',
      'eE4',
      'eG4',
      'eA3',
      'eG4',
      'eD4',
      'eG4',
    ],
    [
      'eC4',
      'eG4',
      'eE4',
      'eG4',
      'eC4',
      'eA4',
      'eF4',
      'eA4',
      'eC3',
      'eG4',
      'eE4',
      'eG4',
      'eA3',
      'eG4',
      'eD4',
      'eG4',
    ],
    [
      'eC4',
      'eG4',
      'eE4',
      'eG4',
      'eC4',
      'eG4',
      'eE4',
      'eG4',
      'eC4',
      'eA4',
      'eD4',
      'eA4',
      'eC4',
      'eG4',
      'eE4',
      'eG4',
    ],
    [
      'eC4',
      'eA4',
      'eD4',
      'eA4',
      'eC4',
      'eG4',
      'eE4',
      'eG4',
      'eA3',
      'eG4',
      'eD4',
      'eG4',
      'eC4',
      'eG4',
      'eE4',
      'eG4',
    ],
  ].flatMap((i) => i);
  const bpm = 100;
  const spb = 60 / bpm;
  const mspb = ((60 / bpm) * 1000) | 0;
  let dir1 = 1;
  let dir2 = 1;
  let i = 0;
  let j = 0;
  await executeCommand(commands.sp, 0, 1000);
  while (notes[i] || accomp[j]) {
    // eslint-disable-next-line no-await-in-loop
    const shouldStop = await executeCommand(commands.qb);
    if (shouldStop) {
      // eslint-disable-next-line no-await-in-loop
      await executeCommand(commands.r);
      break;
    }
    let beats;
    let beats1 = 1;
    let beats2 = 1;
    let p1 = 0;
    let p2 = 0;
    do {
      if (p1 >= beats1) {
        i += 1;
        p1 -= beats1;
        dir1 *= -1;
      }
      const note = notes[i];
      beats1 = (note && duration[note.substr(0, 1)]) || 1;
      const frequency1 = (note && pitch[note.substr(1)]) || 0;
      const dist1 = (note && Math.floor(frequency1 * spb)) || 0;

      if (p2 >= beats2) {
        j += 1;
        p2 -= beats2;
        dir2 *= -1;
      }
      const acco = accomp[j];
      beats2 = (acco && duration[acco.substr(0, 1)]) || 1;
      const frequency2 = (acco && pitch[acco.substr(1)]) || 0;
      const dist2 = (acco && Math.floor(frequency2 * spb)) || 0;

      beats = Math.min(beats1, beats2);
      const step1 = (dist1 * dir1 * beats) | 0;
      const step2 = (dist2 * dir2 * beats) | 0;

      // eslint-disable-next-line no-await-in-loop
      await executeCommand(commands.sm, mspb * beats, step1, step2);

      p1 += beats;
      p2 += beats;
    } while (p1 < beats1 || p2 < beats2);
    i += 1;
    dir1 *= -1;
    j += 1;
    dir2 *= -1;
  }
  await executeCommand(commands.xm, 500, 0, 0);
  await executeCommand(commands.sp, 1, 1000);
  await delay(1000);
  await executeCommand(commands.r);
});

const cmdList = document.getElementById('cmd');
cmdList.addEventListener('change', () => {
  cmdForm.params.value = paramsHistory[cmdForm.cmd.value] || '';
});
Object.keys(commands).forEach((commandName) => {
  const cmdOpt = document.createElement('option');
  const cmd = commands[commandName];
  cmdOpt.innerText = cmd.title;
  cmdOpt.value = commandName;
  cmdList.appendChild(cmdOpt);
});
