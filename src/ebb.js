export const RESPONSE_MULTI_LINE = 0;
export const RESPONSE_SINGLE_LINE = 1;
export const RESPONSE_OK = 2;
export const RESPONSE_CR_NL = 0;
export const RESPONSE_NL_CR = 1;
export const RESPONSE_OK_CR_NL = 2;
export const EXECUTION_IMMEDIATE = 0;
export const EXECUTION_FIFO = 1;
const createCommand = (name, description, parser, options) => {
    return {
        name,
        description,
        parser,
        ...options,
    }
}

export const okParser = async (reader) => {
    return await reader.readUntil(RESPONSE_OK_CR_NL);
}

export const toInt = i => parseInt(i, 10);

export const commandsList = [
    createCommand("A",
        "Analog values get",
        async (reader, response) => {
            // example output: "A,00:0713,02:0241,05:0089:09:1004\r\n"
            const line = await reader.readUntil(RESPONSE_CR_NL);
            const pairs = line.substr(2).split(',');
            return pairs.reduce((memo, pair) => {
                const [port, value] = pair.split(':');
                memo[toInt(port)] = toInt(value);
                return memo;
            }, {});
        }
    ),
    createCommand("AC",
        "Analog Configure",
        okParser,
    ),
    createCommand("BL",
        "enter BootLoader",
        okParser,
    ),
    createCommand("C",
        "Configure (pin dirs)",
        okParser,
    ),
    createCommand("CS",
        "Clear Step position",
        okParser,
    ),
    createCommand("CK",
        "ChecK input",
        async (reader, response) => {
            // example output: "Param1=0\r\nParam2=0\r\nParam3=0\r\nParam4=0\r\nParam5=0\r\nParam6=0\r\nParam7=a\r\nParam8=A\r\nOK\r\n"
            const data = await reader.readUntil(RESPONSE_OK_CR_NL);
            return data.substring(0, data.length - 4)
                .split(/\s+/)
                .map((pair, idx) => {
                    const value = pair.split('=')[1];
                    return idx < 6 ? parseInt(value) : value;
                });
        }
    ),
    createCommand("CU",
        "Configure User options",
        okParser,
    ),
    createCommand("EM",
        "Enable Motors",
        okParser,
        {
            execution: EXECUTION_FIFO,
        }
    ),
    createCommand("ES",
        "E Stop",
        okParser,
    ),
    createCommand("HM",
        "Home or absolute Move",
        okParser,
        {
            execution: EXECUTION_FIFO,
        }
    ),
    createCommand("XM",
        "Stepper Move (mixed)",
        okParser,
        {
            execution: EXECUTION_FIFO,
        }
    ),
    createCommand("SM",
        "Stepper Move",
        okParser,
        {
            execution: EXECUTION_FIFO,
        }
    ),
    createCommand("V",
        "Version",
        async (reader, response) => {
            // example output: "EBBv13_and_above EB Firmware Version 2.4.2\r\n"
            return await reader.readUntil(RESPONSE_CR_NL);
        }
    ),
    createCommand("R",
        "Reset",
        okParser,
    ),

];

export const commands = commandsList.reduce((map, cmd) => ({
    ...map,
    [cmd.name]: cmd
}), {});
