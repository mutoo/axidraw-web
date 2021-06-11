import {
  checkDevice,
  connectDevice,
  disconnectDevice,
  executeCommand,
} from '../usb.js';
import * as commands from '../ebb/index.js';

const paramsHistory = {};

const debugTxt = document.getElementById('debug-txt');
window.addEventListener('unhandledrejection', (e) => {
  debugTxt.value = e.reason;
});

const pairBtn = document.getElementById('pair-btn');
pairBtn.addEventListener('click', async () => {
  try {
    await connectDevice(true);
    await checkDevice();
    debugTxt.value = await executeCommand(commands.v);
  } catch (e) {
    throw new Error(`Can not connect to the EBB: ${e.message}`);
  }
});

const connectBtn = document.getElementById('connect-btn');
connectBtn.addEventListener('click', async () => {
  try {
    await connectDevice();
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
  const notes = [
    ['C5', 'C5', 'G5', 'G5', 'A5', 'A5', 'G5', 1],
    ['F5', 'F5', 'E5', 'E5', 'D5', 'D5', 'C5', 1],
    ['G5', 'G5', 'F5', 'F5', 'E5', 'E5', 'D5', 1],
    ['G5', 'G5', 'F5', 'F5', 'E5', 'E5', 'D5', 1],
    ['C5', 'C5', 'G5', 'G5', 'A5', 'A5', 'G5', 1],
    ['F5', 'F5', 'E5', 'E5', 'D5', 'D5', 'C5', 1],
  ].flatMap((i) => i);
  const accomp = [
    ['C4', 'G4', 'E4', 'G4', 'C4', 'G4', 'E4', 1],
    ['C4', 'A4', 'D4', 'A4', 'C4', 'G4', 'E4', 1],
    ['C4', 'A4', 'D4', 'A4', 'C4', 'G4', 'E4', 1],
    ['B3', 'G4', 'D4', 'F4', 'C4', 'G4', 'E4', 1],
    ['C4', 'G4', 'E4', 'G4', 'C4', 'G4', 'E4', 1],
    ['C4', 'A4', 'D4', 'A4', 'C4', 'G4', 'E4', 1],
  ].flatMap((i) => i);
  const mix = notes.reduce((zip, _, i) => [...zip, [notes[i], accomp[i]]], []);
  let dir = 1;
  const bpm = 80;
  const spb = 60 / bpm;
  const mspb = ((60 / bpm) * 1000) | 0;
  await executeCommand(commands.sp, 0, 1000);
  for (const beat of mix) {
    // eslint-disable-next-line no-await-in-loop
    const shouldStop = await executeCommand(commands.qb);
    if (shouldStop) {
      // eslint-disable-next-line no-await-in-loop
      await executeCommand(commands.r);
      break;
    }
    const frequency1 = pitch[beat[0]] || 0;
    const dist1 = Math.floor(frequency1 * spb);
    const step1 = (dist1 * dir) | 0;
    const frequency2 = pitch[beat[1]] || 0;
    const dist2 = Math.floor(frequency2 * spb);
    const step2 = (dist2 * dir) | 0;

    // eslint-disable-next-line no-await-in-loop
    await executeCommand(commands.sm, mspb, step1, step2);
    dir *= -1;
  }
  await executeCommand(commands.xm, 500, 0, 0);
  await executeCommand(commands.sp, 1, 1000);
  await executeCommand(commands.em, 0, 0);
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
