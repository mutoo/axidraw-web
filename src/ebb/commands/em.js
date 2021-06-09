import {createCommand, handleOKMessage} from "../utils.js";
import {EXECUTION_FIFO} from "../constants.js";

export default createCommand(
    "Enable Motors",
    function* (axis1, axis2) {
        let dataIn = yield `EM,${[axis1, axis2].join(',')}\r`;
        return yield* handleOKMessage(dataIn);
    },
    {
        execution: EXECUTION_FIFO,
    }
);
