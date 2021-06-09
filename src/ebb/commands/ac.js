import {createCommand, handleOKMessage} from "../utils.js";

export default createCommand(
    "Analog configure",
    function* (channel, enable) {
        let dataIn = yield `AC,${[channel,enable].join(',')}\r`;
        return yield* handleOKMessage(dataIn);
    },
    {
        version: "2.2.3"
    }
);
