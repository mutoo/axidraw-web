import {createCommand, readUntil, toInt, transformResult} from "../utils.js";
import {ENDING_OK_CR_NL} from "../constants.js";

export default createCommand(
    "Query pen",
    function* () {
        let dataIn = yield 'QP\r';
        // example response: "1\n\rOK\r\n"
        const parsed = (yield* readUntil(ENDING_OK_CR_NL, dataIn));
        return transformResult(parsed, result => toInt(result));
    },
    {
        version: "1.9.0"
    }
);
