import {checkVersion, decode, handleErrorMessage} from "./ebb/utils.js";
import v from './ebb/commands/v.js';

const TRANSFER_ENDPOINT = 2;
const TRANSFER_PACKET_SIZE = 64;

let device;
let version = "2.7.0";

const commandQueue = [];
const encoder = new TextEncoder();

export const sendToDevice = async (msg) => {
    const data = encoder.encode(msg);
    console.log('Send to device: ', decode(data));
    let result = await device.transferOut(TRANSFER_ENDPOINT, data);
    if (result.status !== 'ok') {
        throw new Error("Can not sent command to device.");
    }
}

export const executeCommand = async (command, ...params) => {
    checkDevice();
    if (command.version) {
        if (!checkVersion(version, command.version)) {
            throw new Error(command.name + " Command expects higher firmware version: " + command.version);
        }
    }
    const cmd = command.create(...params);
    commandQueue.push(cmd);
    const cmdStatus = cmd.next();
    await sendToDevice(cmdStatus.value);
    // if that command is done without taking any response, resolve it immediately.
    if (cmdStatus.done) return Promise.resolve();
    // otherwise queues this command and waiting msg from device.
    return new Promise((resolve, reject) => {
        cmd.resolve = resolve;
        cmd.reject = reject;
    })
};

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
        if (pair || !devices.length) {
            device = await navigator.usb.requestDevice({filters: [{vendorId: 0x04d8, productId: 0xfd92}]});
            if (!device) {
                throw new Error("No EBB device available.");
            }
        } else {
            device = devices[0];
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

    // start listening the data transferred in
    setTimeout(async () => {
        console.log('Start listening data.')
        let buffer = [];
        let errorHandler = null;
        try {
            while (true) {
                const response = await device.transferIn(TRANSFER_ENDPOINT, TRANSFER_PACKET_SIZE);
                if (response.status !== 'ok') {
                    throw new Error("Unexpected response status: " + response.status);
                }
                buffer.push(...new Uint8Array(response.data.buffer));
                // data arrived
                while (buffer.length) {
                    if (commandQueue.length) {
                        if (buffer[0] === '!'.charCodeAt(0)) {
                            errorHandler = handleErrorMessage();
                            errorHandler.next(); // ready
                        }
                        const cmd = commandQueue[0]
                        const handler = errorHandler || cmd;
                        // pass the current buffer to cmd,
                        // and let it consume what it needs.
                        const cmdStatus = handler.next(buffer);
                        const {result, consumed} = cmdStatus.value
                        if (consumed) {
                            buffer = buffer.slice(consumed);
                        }
                        if (cmdStatus.done) {
                            if (handler === errorHandler) {
                                errorHandler = null;
                                cmd.reject(result);
                            } else {
                                console.log('Received message: ' + result)
                                cmd.resolve(result);
                            }
                            commandQueue.shift();
                        }
                    } else {
                        const gabage = decode(buffer);
                        console.log('Discard garbage message: ' + gabage);
                        buffer.length = 0;
                    }
                }
            }
        } catch (e) {
            throw new Error("Can not receive response from device: " + e.message);
        }
    })

    const ret = await executeCommand(v);
    version = ret.match(/\d\.\d\.\d/)[0];
    return version;
}

export const disconnectDevice = async () => {
    checkDevice();
    console.log("Closing device...");
    await device.close();
    device = null;
    version = null;
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

