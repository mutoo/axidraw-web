# Connecting

The plotter, the debugger and the composer share one device connector,
with four ways to reach an AxiDraw. Each sends the same EBB commands and
reads the same responses, so the apps work the same over any of them. What
differs is the path the bytes take, and so where and in which browsers each
one works.

| Way             | The AxiDraw is plugged into | Browser                  | Needs                        |
| --------------- | --------------------------- | ------------------------ | ---------------------------- |
| Web USB         | this computer               | Chromium, such as Chrome | the USB interface to be free |
| Web Serial      | this computer               | Chromium, such as Chrome | the serial port to be free   |
| Web Socket      | another computer            | any                      | the server in this repo      |
| Virtual Plotter | nothing                     | any                      | pop-ups allowed              |

In short: with the AxiDraw on this computer, try **Web USB** first, and use
**Web Serial** where Web USB can't connect. Use **Web Socket** when the
AxiDraw is plugged into another computer, and the **Virtual Plotter** when
there's no AxiDraw at hand.

## How the EBB shows up

The AxiDraw's controller, the EiBotBoard (EBB), is a USB serial device: it
has a USB interface for commands, and the operating system gives it a
serial port, such as `COM3` on Windows, `/dev/cu.usbmodem1101` on macOS or
`/dev/ttyACM0` on Linux. WebUSB and Web Serial reach the same EBB from the
two ends of that. WebUSB takes the USB interface over from the browser, and
Web Serial opens the serial port through the operating system's driver.

## Web USB

WebUSB talks to the EBB's USB interface directly. The connector claims the
interface and moves the bytes in 64-byte packets.

- It works in Chromium-based browsers, such as Chrome and Edge, over HTTPS
  or on `localhost`.
- It needs the interface to itself. Where the operating system's serial
  driver already holds it, as it usually does on Windows, claiming fails, and Web
  Serial is the way in. On Linux, the user also needs access to the raw USB
  device, which usually takes a udev rule.

## Web Serial

Web Serial opens the EBB's serial port, and reads and writes it as a stream
of bytes. The operating system's driver stays in charge of the USB side.

- It works in Chromium-based browsers on the desktop, such as Chrome and
  Edge, over HTTPS or on `localhost`.
- It works where the operating system sees the AxiDraw as a serial port,
  which is everywhere the EBB's driver is installed, Windows included. On
  Linux, the user needs access to the port, usually by being in the
  `dialout` group.
- The port picker lists only AxiDraws. The EBB ignores the baud rate, and
  the connector asks for 9600 as the WebSocket proxy does.

## Web USB and Web Serial alike

- **Pair new device** opens the browser's picker, and the browser remembers
  the AxiDraw picked for this site. **Connect** uses an AxiDraw paired
  before, and opens the picker if there is none.
- One program has the AxiDraw at a time. Close anything else that holds it,
  such as the AxiDraw extension for Inkscape, another tab of this app, or
  the WebSocket proxy, before connecting.
- Unplugging the AxiDraw disconnects it, and the connector says why.

## Web Socket

WebSocket goes through the server in this repository, running on the
computer the AxiDraw is plugged into, such as a Raspberry Pi. The server
opens the EBB's serial port, and passes commands and responses between it
and the browser. See
[Plotting through the WebSocket proxy](../README.md#plotting-through-the-websocket-proxy).

- It works in any browser, as all it needs from the browser is a WebSocket.
- It needs the server running, a certificate the browser trusts, and the
  server's password.
- Each command crosses the network, which on a local network adds little.

## Virtual Plotter

The Virtual Plotter opens an emulated AxiDraw in a window of its own, with
the firmware version and the paper chosen in the connector. It needs no
AxiDraw, works in any browser that allows the pop-up, and knows only the
commands the apps send. See [virtual-plotter.md](virtual-plotter.md).
