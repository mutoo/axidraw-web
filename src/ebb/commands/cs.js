import {createCommand, handleOKMessage} from "../utils.js";

export default createCommand(
    "Clear step position",
    function* () {
        let dataIn = yield 'CS\r';
        return yield* handleOKMessage(dataIn);
    },
    {
        version: "2.4.3"
    }
);
