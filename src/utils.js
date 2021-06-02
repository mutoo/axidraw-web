export const encoder = new TextEncoder();
export const decoder = new TextDecoder();

export const checkInterface = (plotter) => {
    if (!plotter) {
        throw new Error("Plotter is not connected");
    }
    if (!plotter.opened) {
        throw new Error("Plotter is not opened");
    }
    const claimedInterface = plotter.configuration.interfaces.find(i => i.claimed);
    if (claimedInterface?.interfaceNumber !== 1) {
        throw new Error("Plotter interface is not claimed");
    }
}

export const send = async (plotter, msg) => {
    if (!msg) {
        throw new Error("Message could not be empty.");
    }
    const bytes = encoder.encode(msg + "\r");
    const result = await plotter.transferOut(2, bytes)
    if (result.status !== "ok") {
        throw new Error("Can not send data to device: " + result.status);
    }
    return result;
}

const endingWithRN = [13, 10];
const endingWithNR = [10, 13];

export const receive = async (plotter, useReverseEnding = false) => {
    let buffer = [];
    let ending = useReverseEnding ? endingWithNR : endingWithRN;
    while (!(buffer[buffer.length - 2] === ending[0] && buffer[buffer.length - 1] === ending[1])) {
        const result = await plotter.transferIn(2, 64);
        buffer.push(...new Uint8Array(result.data.buffer));
    }
    return decoder.decode(Uint8Array.from(buffer)).trim();
}