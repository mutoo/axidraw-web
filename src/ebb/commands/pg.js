import {createCommand, handleOKMessage} from "../utils.js";

export default createCommand(
    "Pulse go",
    function* (enable) {
        let dataIn = yield `PG,${enable}\r`
        return yield* handleOKMessage(dataIn);
    },
);
