# Axidraw-Web

This project is work-in-progress!

![screenshot](./docs/assets/screenshot-setup.png)

Axidraw-Web allow artists to connect [AxiDraw](https://axidraw.com/) in the browser with the WebUSB API. Or connect to remote AxiDraw with WebSocket proxy. You may also enjoy plotting on a virutal AxiDraw in the browser if you don't have a physical one.

![arch](./docs/assets/axidraw-web-arch.png)

## TODOs

Checkout more on the [project board](https://github.com/mutoo/axidraw-web/projects/1).

### Communication Interface

- [x] EBB Communication via WebUSB
- [x] EBB Communication via WebSocket
- [x] EBB Command Debugger
- [x] EBB Virtual Plotter

### Plotter App

- [x] SVG load and preview
- [x] SVG path parser
- [x] SVG elements to line segments
- [x] Motion Planning (simple)
- [x] Motion Planning (reorder)
- [x] Plotting (constant speed)
- [x] Plotting (acceleration mode)
- [x] Plotting control (pause/resume/stop)
- [x] Page sizes: ISO A1 to A6 and B4 to B6, US, cards and art paper, and the plot area of each AxiDraw, the same in every app
- [ ] Plot skipping/seeking

### Composer

- [x] A singing pen plotter, [it's real.](https://www.instagram.com/p/CP-K1m9J-j1/)
- [x] Play on any page size, with a 15 cm ruler along the page

### Virtual AxiDraw

- [x] Run a virtual AxiDraw in the browser
- [x] Generate motor sounds as the pen moving
- [x] Free-mode Position control: move the carriage by hand, or with the arrow keys, while it's idle with the pen up
- [x] Color control: swap pens of any color between plots
- [x] Size control: pen tips from 0.3 to 2 mm, and paper of any page size
- [x] A 15 cm ruler along the top and left edges of the paper, in five styles, or none
- [x] Clear the paper, and save it as a PNG or an SVG
- [x] Show whether the main window is still connected
- [x] Keep the window, and the drawing on it, when connecting again
- [x] Plot faster than real time, and press the PRG button

## Play it on browsers:

The latest version is deployed at https://axidraw.mutoo.im , you don't need to install any software or plugins to use it. Just open the website and plug the AxiDraw on your machine to plot any svg with it.

### Other Apps

Try the [Debugger](https://axidraw.mutoo.im/#debugger) if you want to play with low-level ebb command.

Try the [Composer](https://axidraw.mutoo.im/#composer) if you wondering how the pen plotter singing.

No AxiDraw at hand? Pick **Virtual Plotter** in the device connector, choose the paper, and plot on a virtual one in a window of its own. See [docs/virtual-plotter.md](docs/virtual-plotter.md) for what it can do.

## Run locally

Make sure you have Node.js 24 (see `.nvmrc`) and pnpm 12 installed. Then checkout the repo and run `pnpm i` to install all the dependencies.

```
$ pnpm dev
```

## Run remotely

Sometime you want to use the AxiDraw connected to a raspberry pi or NAS, you can run the server on the remote machine and connect to it via WebSocket.

You will need to build the project first, and then run the server with a self-signed cert:

```
$ pnpm build
$ bash ./scripts/create-cert.sh
$ pnpm run server
```

The server runs directly on Node.js (native TypeScript support, no build step needed). The WebSocket proxy is protected by a password, `axidraw-web` by default. Set the `AXIDRAW_AUTH` environment variable to change it, e.g. `AXIDRAW_AUTH=my-secret pnpm run server`.

### Self-signed cert

In order to use WebUSB on the browser, you'll need to make it in a secure contexts. The localhost is considered a secure context, but the LAN address is not. So if you want to run it via LAN, you have to generate a self-signed cert on your own:

```
$ bash ./scripts/create-cert.sh
```

This command will generate a `CA.pem` and `localhost.crt` in the `server/cert` folder.

Please import the `CA.pem` to your system or browser and trust it for Secure Sockets Layer (SSL).

The local server will use the `localhost.crt` and `localhost.key` to host the website at:

```
https://localhost:8443
```

The cert generation script will also provide extra DNS including your hostname, and a wildcard dns address with your LAN ip (in case you don't have mDNS service in your OS):

```
# e.g. your hostname is raspberry-pi.local
# and your LAN ip is 192.168.3.14
https://raspberry-pi.local:8443
https://192.168.3.14.nip.io:8443
```

N.B. The certificate can be download at from browser.

```
https://<Device-IP>:8443/ca
```

This very handy when you run the web server on Raspberry PI or other computer and access it at your work device.

### Production build

To run production build locally, run the `pnpm build` to build the and, and then `pnpm preview` to start the web server:

```
$ pnpm build
$ pnpm preview
```

Then visit the app in your browser with links listed in the section above.

### Development build

Feel free to run dev build if you like to inspect how the app work with devTools:

```
$ pnpm dev
```

it will run a dev server at `http://localhost:5173`.

## Run on Raspberry PI

What if you plug in the axidraw on a Raspberry PI? No problem! This app also provide a proxy mode via WebSocket, so that you can run a web server to communicate the axidraw and your browsers in different computers.

N.B. The serialport/usb permission has to be set up so that the server can communicate with the device.

## License

MIT

## Credits

Thanks [Evil Mad Scientist](https://www.evilmadscientist.com/) for providing such a great machine to play with.

This project is initially inspired by [saxi](https://github.com/nornagon/saxi). That I want to build a Web App like this without install a node project locally.
