import {createCommand, handleOKMessage} from "../utils.js";
import {EXECUTION_FIFO} from "../constants.js";

export default createCommand(
    "Stepper move, mixed-axis geometries",
    function* (duration, xSteps, ySteps) {
        let dataIn = yield `XM,${duration},${xSteps},${ySteps}\r`;
        return yield* handleOKMessage(dataIn);
    },
    {
        execution: EXECUTION_FIFO,
        version: '2.3.0'
    }
);
