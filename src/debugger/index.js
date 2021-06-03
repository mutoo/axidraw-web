import {checkDevice, connectDevice, disconnectDevice, sendCommand} from "../usb.js";
import {commands} from "../ebb.js";

let plotter;

const debugTxt = document.getElementById('debug-txt');
window.addEventListener('unhandledrejection', (e) => {
    debugTxt.value = e.reason;
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
    } catch (e) {
        throw new Error("Can not disconnect to the EBB: " + e.message);
    }
})

const cmdForm = document.getElementById("cmd-form");
cmdForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cmd = cmdForm.cmd.value.trim();
    cmdForm.result.value = await sendCommand(commands[cmd]);
})

export const getPlotter = () => plotter;
