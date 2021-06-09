import {createCommand, handleOKMessage} from "../utils.js";

export default createCommand(
    "Configure user options",
    function* (number, value) {
        let dataIn = yield `CU,${[number, value].join(',')}\r`;
        return yield* handleOKMessage(dataIn);
    },
);
