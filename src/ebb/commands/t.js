import {createCommand, handleOKMessage} from "../utils.js";

export default createCommand(
    "Timed analog/digital read",
    function* (duration, mode) {
        let dataIn = yield `T,${duration},${mode}\r`;
        return yield* handleOKMessage(dataIn);
    },
);
