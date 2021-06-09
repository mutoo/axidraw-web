import {cmdWithOptionalParams, createCommand, handleOKMessage} from "../utils.js";

export default createCommand(
    "Pin direction",
    function* (port, pin, direction) {
        let dataIn = yield `PD,${port},${pin},${direction}\r`
        return yield* handleOKMessage(dataIn);
    },
);
