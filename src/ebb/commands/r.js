import {createCommand, handleOKMessage} from "../utils.js";

export default createCommand(
    "Reset",
    function* () {
        let dataIn = yield 'R\r';
        const parsed = yield* handleOKMessage(dataIn);
        // the R command would receive OK twice
        dataIn = yield parsed;
        return yield* handleOKMessage(dataIn);
    },
);
