import {createCommand, handleOKMessage} from "../utils.js";

export default createCommand(
    "Enter bootloader",
    function* () {
        let dataIn = yield 'BL\r';
        return yield* handleOKMessage(dataIn);
    },
    {
        version: "1.9.5"
    }
);
