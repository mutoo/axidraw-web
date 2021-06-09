import {cmdWithOptionalParams, createCommand, handleOKMessage} from "../utils.js";
import {EXECUTION_FIFO} from "../constants.js";

export default createCommand(
    "Set RC Servo power timeout",
    function* (timeout, state) {
        let dataIn = yield cmdWithOptionalParams(`SR,${timeout}`, state);
        return yield* handleOKMessage(dataIn);
    },
    {
        version: '2.6.0',
    },
);
