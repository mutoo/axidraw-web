import {createCommand, readUntil} from "../utils.js";
import {ENDING_CR_NL} from "../constants.js";

export default createCommand(
    "Version",
    function* () {
        let dataIn = yield 'V\r';
        // example response: "EBBv13_and_above EB Firmware Version 2.7.0\r\n"
        return yield * readUntil(ENDING_CR_NL, dataIn);
    },
);
