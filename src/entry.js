import {checkInterface, receive, send} from './utils.js'

let plotter;

const debugTxt = document.getElementById('debug-txt');
window.addEventListener('unhandledrejection', (e) => {
    debugTxt.value = e.reason;
});

const connectBtn = document.getElementById('connect-btn');
connectBtn.addEventListener('click', async () => {
    if (!navigator.usb) {
        throw new Error("USB functions is not supported in this browser!");
    }

    try {
        if (!plotter) {
            plotter = await navigator.usb.requestDevice({filters: [{vendorId: 0x04d8, productId: 0xfd92}]});
            if (!plotter) {
                throw new Error("No Axidraw device available.");
            }
        }
        if (!plotter.opened) {
            console.log("Opening device...");
            await plotter.open();
        }
        console.log("Selecting configuration..");
        await plotter.selectConfiguration(1);
        console.log("Claiming interface...");
        await plotter.claimInterface(1);
        console.log("Checking interface...");
        checkInterface(plotter);
        console.log("Checking version...");
        await send(plotter, "V");
        const version = await receive(plotter);
        console.log("Current device information: " + version);

        window.plotter = plotter;
    } catch (e) {
        throw new Error("Can not connect to the AxiDraw: " + e.message);
    }
});

const disconnectBtn = document.getElementById('disconnect-btn');
disconnectBtn.addEventListener('click', async (e) => {
    checkInterface(plotter);
    console.log("Closing plotter...");
    await plotter.close();
    console.log("Plotter is closed");
})

export const sendAndReceive = async (msg) => {
    checkInterface(plotter);
    await send(plotter, msg);
    let useReverseEnding = ["A", "LT", "LM", "QM"].includes(msg.trim().toLocaleUpperCase());
    return await receive(plotter, useReverseEnding);
};

const cmdForm = document.getElementById("cmd-form");
cmdForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cmd = cmdForm.cmd.value.trim();
    cmdForm.result.value = await sendAndReceive(cmd);
})
