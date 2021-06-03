export const RESPONSE_MULTI_LINE = 0;
export const RESPONSE_SINGLE_LINE = 1;
export const RESPONSE_CR_NL = 0;
export const RESPONSE_NL_CR = 1;
export const RESPONSE_OK_CR_NL = 2;

const createCommand = (name, response, parser) => {
    return {
        name,
        response,
        parser,
    }
}

const ebbCommands = [
    createCommand("A",
        {
            type: RESPONSE_SINGLE_LINE,
            ending: RESPONSE_CR_NL,
            sample: "A,00:0713,02:0241,05:0089:09:1004\r\n",
        },
        async (reader, response) => {
            const line = await reader.readline(response.ending);
            const data = line.substr(2).split(':');
            const toInt = i => parseInt(i, 10);
            const ports = data.filter((_, i) => i % 2 === 0).map(toInt)
            const values = data.filter((_, i) => i % 2 === 0).map(toInt)
            return ports.reduce((memo, port, idx) => ({
                ...memo,
                [port]: values[idx]
            }), {})
        }
    ),
    createCommand("V",
        {
            type: RESPONSE_SINGLE_LINE,
            ending: RESPONSE_CR_NL,
            sample: "EBBv13_and_above EB Firmware Version 2.4.2\r\n",
        },
        async (reader, response) => {
            const line = await reader.readline(response.ending);
            return line.trim();
        }
    )
];

export const commands = ebbCommands.reduce((map, cmd) => ({
    ...map,
    [cmd.name]: cmd
}), {});
