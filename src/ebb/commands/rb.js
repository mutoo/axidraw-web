import {createCommand, readUntil, toInt} from "../utils.js";
import {ENDING_OK_CR_NL} from "../constants.js";

export default createCommand(
    "Reboot",
    function* () {
        return 'RB\r';
        // no data returned
    },
    {
        version: "2.5.4"
    }
);
