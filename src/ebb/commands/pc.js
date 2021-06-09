import {cmdWithOptionalParams, createCommand, handleOKMessage} from "../utils.js";

export default createCommand(
    "Pulse configure",
    function* (len0, period0, len1, period1, len2, period2, len3, period3) {
        let dataIn = yield cmdWithOptionalParams(`PC,${len0},${period0}`, len1, period1, len2, period2, len3, period3);
        return yield* handleOKMessage(dataIn);
    },
);
