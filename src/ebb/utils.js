import {ENDING_CR_NL} from "./constants.js";

export const createCommand = (title, create, options) => {
    return {
        title,
        create,
        ...{options},
    }
};

const decoder = new TextDecoder();
export const decode = (buffer) =>
    decoder.decode(Uint8Array.from(buffer));

export const readUntil = function* (ending, dataIn) {
    let buffer = '';
    let foundEnding = -1;
    if(!dataIn)
        dataIn = yield;
    do {
        const msg = decode(dataIn);
        foundEnding = msg.indexOf(ending);
        if (foundEnding !== -1) {
            foundEnding += ending.length;
            buffer += msg.substring(0, foundEnding);
            return {
                result: buffer,
                consumed: foundEnding
            };
        }

        buffer += msg;
        dataIn = yield {consumed: msg.length};
    } while (foundEnding === -1);
}

export const handleErrorMessage = function* () {
    return yield* readUntil(ENDING_CR_NL)
}