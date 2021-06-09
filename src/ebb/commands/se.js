import {cmdWithOptionalParams, createCommand, handleOKMessage} from "../utils.js";
import {EXECUTION_FIFO} from "../constants.js";

export default createCommand(
    "Set engraver",
    function* (state, power, useMotionQueue) {
        let dataIn = yield cmdWithOptionalParams(`SE,${state}`, power, useMotionQueue);
        return yield* handleOKMessage(dataIn);
    },
    {
        execution: EXECUTION_FIFO,
        version: "2.1.0"
    }
);
