# Axidraw-Web

This project is work-in-progress!

![screenshot](./docs/screenshot-setup.png)

Axidraw-Web allow artists to connect [AxiDraw](https://axidraw.com/) in the browser with the WebUSB API. Or connect to remote AxiDraw with WebSocket proxy.

![arch](./docs/axidaw-web-arch.png)

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
- [ ] Plot skipping/seeking

### Composer

- [x] A singing pen plotter, [it's real.](https://www.instagram.com/p/CP-K1m9J-j1/)

## Play it on browsers:

The latest version is deployed at https://axidraw.mutoo.im , you don't need to install any software or plugins to use it. Just open the website and plug the AxiDraw on your machine to plot any svg with it.

### Other Apps

Try the [Debugger](https://axidraw.mutoo.im/debugger.html) if you want to play with low-level ebb command.

Try the [Composer](https://axidraw.mutoo.im/composer.html) if you wondering how the pen plotter singing.

## Run locally

Make sure you have node 12+ and yarn installed. Then checkout the repo and run `yarn` to install all the dependencies.

```
$ yarn
```

### Self-signed cert

In order to use WebUSB on the browser, you have to generate a self-signed cert on your own:

```
$ bash ./scripts/create-cert.sh
```

This is required even you are running it locally. This command will generate a `CA.pem` and `localhost.crt` in the `server/cert` folder.

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
https://192.168.3.14.nip.io:8433
```

This very handy when you run the web server on Raspberry PI or other computer.

### Production build

To run production build locally, run the `yarn build` to build the and, and then `yarn start` to start the web server:

```
$ yarn build
$ yarn start
```

Then visit the app in your browser with links listed in the section above.

### Development build

Feel free to run dev build if you like to inspect how the app work with devTools:

```
$ yarn dev
```

it will run a dev server at `https://localhost:8443`, which will popup automatically in your browser.

## Run on Raspberry PI

What if you plug in the axidraw on a Raspberry PI? No problem! This app also provide a proxy mode via WebSocket, so that you can run a web server to communicate the axidraw and your browsers in different computers.

N.B. The serialport/usb permission has to be set up so that the server can communicate with the device.

## License

MIT

## Credits

Thanks [Evil Mad Scientist](https://www.evilmadscientist.com/) for providing such a great machine to play with.

This project is initially inspired by [saxi](https://github.com/nornagon/saxi). That I want to build a Web App like this without install a node project locally.