import {createCommand, handleOKMessage} from "../utils.js";

export default createCommand(
    "Set EBB nickname tag",
    function* (tag) {
        let dataIn = yield `ST,${tag}\r`;
        return yield* handleOKMessage(dataIn);
    },
    {
        version: '2.5.5'
    }
);
