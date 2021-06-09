import {createCommand, readUntil, toInt, transformResult} from "../utils.js";
import {ENDING_OK_CR_NL} from "../constants.js";

export default createCommand(
    "Query step position",
    function* () {
        let dataIn = yield 'QS\r';
        // example response: "1024,-512\n\rOK\r\n"
        const parsed = (yield* readUntil(ENDING_OK_CR_NL, dataIn));
        return transformResult(parsed, result => {
            const positions = result.substring(0, result.length - 6)
                .split(",")
                .map(toInt);
            return {
                a1: positions[0],
                a2: positions[1],
            };
        });
    },
    {
        version: "2.4.3"
    }
);
