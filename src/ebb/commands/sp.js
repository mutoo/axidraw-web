import {cmdWithOptionalParams, createCommand, handleOKMessage} from "../utils.js";
import {EXECUTION_FIFO} from "../constants.js";

export default createCommand(
    "Set pen state",
    function* (value, duration, portBpin) {
        let dataIn = yield cmdWithOptionalParams(`SP,${value}`, duration, portBpin);
        return yield* handleOKMessage(dataIn);
    },
    {
        execution: EXECUTION_FIFO,
    },
);
