import {createCommand, handleOKMessage} from "../utils.js";

export default createCommand(
    "Node count decrement",
    function* () {
        let dataIn = yield `ND\r`;
        return yield* handleOKMessage(dataIn);
    },
    {
        version: "1.9.5"
    }
);
