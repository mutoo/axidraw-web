import {cmdWithOptionalParams, createCommand, handleOKMessage} from "../utils.js";
import {EXECUTION_FIFO} from "../constants.js";

export default createCommand(
    "General RC Servo output",
    function* (position, outputPin, rate, delay) {
        let dataIn = yield cmdWithOptionalParams(`S2,${position},${outputPin}`, rate, delay);
        return yield* handleOKMessage(dataIn);
    },
    {
        execution: EXECUTION_FIFO,
        version: "2.2.0",
    }
);
