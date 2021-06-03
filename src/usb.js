import {RESPONSE_CR_NL, RESPONSE_NL_CR, RESPONSE_OK_CR_NL} from "./ebb.js";

const TRANSFER_ENDPOINT = 2;
const TRANSFER_PACKET_SIZE = 64;

let device;

export const connectDevice = async (pair = false) => {
    if (!navigator.usb) {
        throw new Error("WebUSB feature is not supported in this browser!");
    }

    if (!device) {
        const devices = await navigator.usb.getDevices();
        devices.forEach(p => {
            console.log('Found device: ' + p.productName);
        })
        // select first available device
        device = devices[0];
        if (!device || pair) {
            device = await navigator.usb.requestDevice({filters: [{vendorId: 0x04d8, productId: 0xfd92}]});
            if (!device) {
                throw new Error("No EBB device available.");
            }
        }
    }
    if (!device.opened) {
        console.log("Opening device...");
        await device.open();
    }
    console.log("Selecting configuration..");
    await device.selectConfiguration(1);
    console.log("Claiming interface...");
    await device.claimInterface(1);
}

export const disconnectDevice = async () => {
    checkDevice();
    console.log("Closing device...");
    await device.close();
    console.log("Device is closed");
}

export const checkDevice = () => {
    if (!device) {
        throw new Error("Device is not connected");
    }
    if (!device.opened) {
        throw new Error("Device is not opened");
    }
    const claimedInterface = device.configuration.interfaces.find(i => i.claimed);
    if (claimedInterface?.interfaceNumber !== 1) {
        throw new Error("Device interface is not claimed");
    }
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const lineEndingCodes = {
    [RESPONSE_CR_NL]: encoder.encode('\r\n'),
    [RESPONSE_NL_CR]: encoder.encode('\n\r'),
    [RESPONSE_OK_CR_NL]: encoder.encode('OK\r\n'),
};

const detectLineEnding = (buffer, lineEndingBuffer) => {
    let n = lineEndingBuffer.length;
    let m = buffer.length;
    for (let i = 1; i <= n; i++) {
        if (buffer[m - i] !== lineEndingBuffer[n - i]) {
            return false;
        }
    }
    return true;
}

const reader = {
    readline: async (lineEnding) => {
        let result;
        let buffer = [];
        let foundLineEnding = false;
        do {
            result = await device.transferIn(TRANSFER_ENDPOINT, TRANSFER_PACKET_SIZE);
            if (result.status !== 'ok') {
                throw new Error("Can not receive response to device.");
            }
            buffer.push(...new Uint8Array(result.data.buffer));
            foundLineEnding = detectLineEnding(buffer, lineEndingCodes[lineEnding ?? RESPONSE_OK_CR_NL])
        } while (!foundLineEnding);
        return decoder.decode(Uint8Array.from(buffer));
    }
}

export const sendCommand = async (command) => {
    checkDevice();
    const data = encoder.encode(command.name + '\r');
    let result = await device.transferOut(TRANSFER_ENDPOINT, data);
    if (result.status !== 'ok') {
        throw new Error("Can not sent command to device.");
    }
    return await command.parser(reader, command.response);
}
