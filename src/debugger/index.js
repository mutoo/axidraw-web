import {checkDevice, connectDevice, disconnectDevice, sendCommand} from "../usb.js";
import {commands, commandsList} from "../ebb.js";

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
        debugTxt.value = await sendCommand(commands.V);
    } catch (e) {
        throw new Error("Can not connect to the EBB: " + e.message);
    }
});

const connectBtn = document.getElementById('connect-btn');
connectBtn.addEventListener('click', async () => {
    try {
        await connectDevice();
        await checkDevice();
        debugTxt.value = await sendCommand(commands.V);
    } catch (e) {
        throw new Error("Can not connect to the EBB: " + e.message);
    }
});

const disconnectBtn = document.getElementById('disconnect-btn');
disconnectBtn.addEventListener('click', async (e) => {
    try {
        await disconnectDevice();
        debugTxt.value = "Disconnected"
    } catch (e) {
        throw new Error("Can not disconnect to the EBB: " + e.message);
    }
})

const cmdForm = document.getElementById("cmd-form");
cmdForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await checkDevice();
    } catch (e) {
        await connectDevice();
    }
    const cmd = cmdForm.cmd.value.trim();
    const params = cmdForm.params.value.trim();
    paramsHistory[cmd] = params;
    const result = await sendCommand(commands[cmd], params);
    if (typeof result === "object") {
        cmdForm.result.value = JSON.stringify(result)
    } else {
        cmdForm.result.value = result;
    }
})

const musicBtn = document.getElementById('music-btn');
musicBtn.addEventListener('click', async (e) => {
    const pitch = {
        'G4': 392,
        'A4': 440,
        'B4': 494,
        'C5': 523,
        'D5': 587,
        'E5': 659,
        'F5': 698,
        'G5': 784,
        'A5': 880,
        'B5': 988,
        'C6': 1047,
    }
    const notes = [
        ['C5', 'C5', 'G5', 'G5', 'A5', 'A5', 'G5', 1],
        ['F5', 'F5', 'E5', 'E5', 'D5', 'D5', 'C5', 1],
        ['G5', 'G5', 'F5', 'F5', 'E5', 'E5', 'D5', 1],
        ['G5', 'G5', 'F5', 'F5', 'E5', 'E5', 'D5', 1],
        ['C5', 'C5', 'G5', 'G5', 'A5', 'A5', 'G5', 1],
        ['F5', 'F5', 'E5', 'E5', 'D5', 'D5', 'C5', 1],
    ].flatMap(i => i);
    let dir = 1;
    let bpm = 120;
    let spb = 60 / bpm;
    let mspb = (60 / bpm * 1000) | 0;
    for (let note of notes) {
        if (typeof note === "number") {
            await sendCommand(commands['XM'], `${mspb * note},0,0`);
        } else {
            const frequency = pitch[note]
            const dist = Math.floor(frequency * spb);
            await sendCommand(commands['CS']);
            // await sendCommand(commands['HM'], dir ? `${frequency},${dist},0` : `${frequency},0,${dist}`);
            await sendCommand(commands['SM'], `${mspb},${(frequency * spb * dir) | 0},0`);
            dir *= -1;
        }
    }
    console.log('send');
})

const cmdList = document.getElementById('cmd');
cmdList.addEventListener('change', (e) => {
    cmdForm.params.value = paramsHistory[cmdForm.cmd.value] || '';
})
commandsList.forEach(command => {
    const cmdOpt = document.createElement('option');
    cmdOpt.innerText = command.description;
    cmdOpt.value = command.name;
    cmdList.appendChild(cmdOpt);
})
