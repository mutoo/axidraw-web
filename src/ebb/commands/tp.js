import {cmdWithOptionalParams, createCommand, handleOKMessage} from "../utils.js";
import {EXECUTION_FIFO} from "../constants.js";

export default createCommand(
    "Toggle pen",
    function* (duration) {
        let dataIn = yield cmdWithOptionalParams(`TP`, duration);
        return yield* handleOKMessage(dataIn);
    },
    {
        version: '1.9.0',
    },
);
