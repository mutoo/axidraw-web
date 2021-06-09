import {createCommand, readUntil, toInt, transformResult} from "../utils.js";
import {ENDING_CR_NL} from "../constants.js";

export default createCommand(
    "Get analog values",
    function* () {
        let dataIn = yield 'A\r';
        // example response: "A,00:0713,02:0241,05:0089:09:1004\r\n"
        const parsed = (yield* readUntil(ENDING_CR_NL, dataIn));
        return transformResult(parsed, result => {
            const pairs = result.trim().substr(2).split(',');
            return pairs.reduce((memo, pair) => {
                const [port, value] = pair.split(':');
                memo[toInt(port)] = toInt(value);
                return memo;
            }, {});
        });
    },
    {
        version: "2.2.3"
    }
);
