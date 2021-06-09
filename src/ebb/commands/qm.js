import {createCommand, readUntil, toInt, transformResult} from "../utils.js";
import {ENDING_NL_CR} from "../constants.js";

export default createCommand(
    "Query motors",
    function* () {
        let dataIn = yield 'QM\r';
        // example response: "QM,0,0,0,0\n\r"
        const parsed = (yield* readUntil(ENDING_NL_CR, dataIn));
        return transformResult(parsed, result => {
            const results = result.trim().substr(3).split(',').map(toInt);
            return {
                command: results[0],
                motor1: results[1],
                motor2: results[2],
                fifo: results[3],
            };
        });
    },
    {
        version: "2.4.4"
    }
);
