import {createCommand, handleOKMessage} from "../utils.js";

export default createCommand(
    "Reset",
    function* () {
        let dataIn = yield 'R\r';
        return yield* handleOKMessage(dataIn);
    },
);
