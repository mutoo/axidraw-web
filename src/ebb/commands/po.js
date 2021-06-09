import {createCommand, handleOKMessage} from "../utils.js";

export default createCommand(
    "Pin output",
    function* (port,pin,value) {
        let dataIn = yield `PO,${port},${pin},${value}\r`;
        return yield* handleOKMessage(dataIn);
    },
);
