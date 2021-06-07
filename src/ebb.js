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
    return (await reader.readUntil(RESPONSE_OK_CR_NL)).trim();
}

export const toInt = i => parseInt(i, 10);

export const commandsList = [
    createCommand("A",
        "Analog values get",
        async (reader) => {
            // example response: "A,00:0713,02:0241,05:0089:09:1004\r\n"
            const line = await reader.readUntil(RESPONSE_CR_NL);
            const pairs = line.trim().substr(2).split(',');
            return pairs.reduce((memo, pair) => {
                const [port, value] = pair.split(':');
                memo[toInt(port)] = toInt(value);
                return memo;
            }, {});
        },
        {
            version: "2.2.3"
        }
    ),
    createCommand("AC",
        "Analog Configure",
        okParser,
        {
            version: "2.2.3"
        }
    ),
    createCommand("BL",
        "enter BootLoader",
        okParser,
        {
            version: "1.9.5"
        }
    ),
    createCommand("C",
        "Configure (pin dirs)",
        okParser,
    ),
    createCommand("CS",
        "Clear Step position",
        okParser,
        {
            version: "2.4.3"
        }
    ),
    createCommand("CK",
        "ChecK input",
        async (reader) => {
            // example response: "Param1=0\r\nParam2=0\r\nParam3=0\r\nParam4=0\r\nParam5=0\r\nParam6=0\r\nParam7=a\r\nParam8=A\r\nOK\r\n"
            const data = await reader.readUntil(RESPONSE_OK_CR_NL);
            return data.substring(0, data.length - 6)
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
        {
            version: "2.2.7"
        }
    ),
    createCommand("HM",
        "Home or absolute Move",
        okParser,
        {
            execution: EXECUTION_FIFO,
            version: "2.6.2"
        }
    ),
    createCommand("I",
        "Input (digital)",
        async (reader) => {
            // example response: "I,PortA,PortB,PortC,PortD,PortE\r\n"
            const data = await reader.readUntil(RESPONSE_CR_NL);
            return data.trim().substr(2).split(',').map(toInt);
        },
    ),
    createCommand("LM",
        "Love-level Move (step)",
        okParser,
        {
            execution: EXECUTION_FIFO,
            version: "2.7.0",
        }
    ),
    createCommand("LT",
        "Love-level move (Time)",
        okParser,
        {
            execution: EXECUTION_FIFO,
            version: "2.7.0",
        }
    ),
    createCommand("MR",
        "Memory Read",
        async (reader) => {
            // example response: "MR,071\r\n"
            const data = await reader.readUntil(RESPONSE_CR_NL);
            return toInt(data.trim().substr(3));
        },
    ),
    createCommand("MW",
        "Memory Write",
        okParser,
    ),
    createCommand("ND",
        "Node count Decrement",
        okParser,
        {
            version: "1.9.5"
        }
    ),
    createCommand("NI",
        "Node count Increment",
        okParser,
    ),
    createCommand("O",
        "Output (digital)",
        okParser,
    ),
    createCommand("PC",
        "Pulse Configure",
        okParser,
    ),
    createCommand("PG",
        "Pulse Go",
        okParser,
    ),
    createCommand("PI",
        "Pin Input",
        async (reader) => {
            // example response: "PI,1\r\n"
            const data = await reader.readUntil(RESPONSE_CR_NL);
            return toInt(data.trim().substr(3));
        },
    ),
    createCommand("PO",
        "Pin Output",
        okParser,
    ),
    createCommand("QB",
        "Query Button",
        async (reader) => {
            const data = await reader.readUntil(RESPONSE_OK_CR_NL);
            return toInt(data);
        },
        {
            version: "1.9.2"
        }
    ),
    createCommand("QC",
        "Query Current",
        async (reader) => {
            // example response: "0394,0300\r\nOK\r\n"
            const data = await reader.readUntil(RESPONSE_OK_CR_NL);
            const values = data.substring(0, data.length - 6)
                .split(",")
                .map(v => (toInt(v) / 1023 * 3.3).toFixed(2));
            const wrap = (v) => ({
                voltage: v,
                maxCurrent: (v / 1.76).toFixed(2),
            });
            return {
                ra0: wrap(values[0]),
                vPlus: wrap(values[1])
            }
        },
        {
            version: "2.2.3"
        }
    ),
    createCommand("QE",
        "Query motor Enables",
        async (reader) => {
            // example response: "0,4\r\nOK\r\n"
            const data = await reader.readUntil(RESPONSE_OK_CR_NL);
            return data.substring(0, data.length - 6)
                .split(",")
                .map(toInt);
        },
        {
            version: "2.8.0"
        }
    ),
    createCommand("QG",
        "Query General",
        async (reader) => {
            // example response: "3E\r\n"
            const data = await reader.readUntil(RESPONSE_CR_NL);
            const results = parseInt(data, 16);
            return {
                fifo: (results & 1) > 0,
                mtr2: (results & 2) > 0,
                mtr1: (results & 4) > 0,
                cmd: (results & 8) > 0,
                pen: (results & 16) > 0,
                prg: (results & 32) > 0,
                rb2: (results & 64) > 0,
                rb5: (results & 128) > 0,
            }
        },
        {
            version: "2.6.2"
        }
    ),
    createCommand("QL",
        "Query Layer",
        async (reader) => {
            // example response: "4\r\nOK\r\n"
            const data = await reader.readUntil(RESPONSE_OK_CR_NL);
            return toInt(data);
        },
        {
            version: "1.9.2"
        }
    ),
    createCommand("QM",
        "Query Motors",
        async (reader) => {
            // example response: "QM,0,0,0,0\n\r"
            const data = await reader.readUntil(RESPONSE_NL_CR);
            const results = data.trim().substr(3).split(',').map(toInt);
            return {
                command: results[0],
                motor1: results[1],
                motor2: results[2],
                fifo: results[3],
            }
        },
        {
            version: "2.4.4"
        }
    ),
    createCommand("QN",
        "Query Node count",
        async (reader) => {
            // example response: "256\r\nOK\r\n"
            const data = await reader.readUntil(RESPONSE_OK_CR_NL);
            return toInt(data.substring(0, data.length - 6));
        },
        {
            version: "1.9"
        }
    ),
    createCommand("QP",
        "Query Pen",
        async (reader) => {
            // example response: "1\r\nOK\r\n"
            const data = await reader.readUntil(RESPONSE_OK_CR_NL);
            return toInt(data);
        },
        {
            version: "1.9"
        }
    ),
    createCommand("QR",
        "Query Rc servo",
        async (reader) => {
            // example response: "1\r\nOK\r\n"
            const data = await reader.readUntil(RESPONSE_OK_CR_NL);
            return toInt(data);
        },
        {
            version: "2.6"
        }
    ),
    createCommand("QS",
        "Query Step pos",
        async (reader) => {
            // example response: "1024,-512\n\rOK\r\n"
            const data = await reader.readUntil(RESPONSE_OK_CR_NL);
            return data.substring(0, data.length - 6)
                .split(",")
                .map(toInt);
        },
        {
            version: "2.4.3"
        }
    ),
    createCommand("QT",
        "Query nickname Tag",
        async (reader) => {
            // example response: "East EBB\r\nOK\r\n"
            const data = await reader.readUntil(RESPONSE_OK_CR_NL);
            return data.substring(0, data.length - 6);
        },
        {
            version: "2.5.4"
        }
    ),
    createCommand("RB",
        "ReBoot",
        async () => {
        },
        {
            version: "2.5.4"
        }
    ),
    createCommand("R",
        "Reset",
        okParser,
    ),
    createCommand("S2",
        "Servo Output",
        okParser,
        {
            version: "2.2.0"
        }
    ),
    createCommand("SC",
        "Stepper & servo mode Configure",
        okParser,
    ),
    createCommand("SE",
        "Set Engraver",
        okParser,
        {
            version: "2.1.0"
        }
    ),
    createCommand("SL",
        "Set Layer",
        okParser,
        {
            version: '1.9.2',
        }
    ),
    createCommand("SM",
        "Stepper Move",
        okParser,
        {
            execution: EXECUTION_FIFO,
        }
    ),
    createCommand("SN",
        "Set Node count",
        okParser,
        {
            version: "1.9.5"
        }
    ),
    createCommand("SP",
        "Set Pen state",
        okParser,
    ),

    createCommand("SR",
        "Servo poweR timeout",
        okParser,
        {
            version: "2.6.0"
        }
    ),
    createCommand("T",
        "Timed ",
        okParser,
    ),
    createCommand("TP",
        "Toggle Pen",
        okParser,
        {
            version: "1.9"
        }
    ),
    createCommand("V",
        "Version",
        async (reader) => {
            // example response: "EBBv13_and_above EB Firmware Version 2.7.0\r\n"
            return (await reader.readUntil(RESPONSE_CR_NL)).trim();
        }
    ),

    createCommand("XM",
        "Stepper Move (mixed)",
        okParser,
        {
            execution: EXECUTION_FIFO,
        },
        {
            version: "2.3.0"
        }
    ),
];

export const commands = commandsList.reduce((map, cmd) => ({
    ...map,
    [cmd.name]: cmd
}), {});
