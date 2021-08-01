This repo is in work-in-progress actively!

# Axidraw-web

This project allow users to control axidraw in the browser with the WebUSB API.

## TODOs

### Communication Interface

- [x] EBB Communication via WebUSB
- [x] EBB Communication via WebSocket
- [x] EBB Command Debugger
- [ ] Extract it from this repo and make it a npm module

### Plotter App

- [x] SVG load and preview
- [x] SVG path parser
- [x] SVG elements to line segments
- [x] Motion Planning (simple)
- [ ] Motion Planning (reorder)
- [x] Plotting (constant speed)
- [ ] Plotting (acceleration mode)
- [ ] Plotting (acceleration mode)
- [x] Plotting control (pause/resume/stop)
- [ ] Plot skipping/seeking

### Composer

- [x] A singing pen plotter, [it's real.](https://www.instagram.com/p/CP-K1m9J-j1/)

## Play it on browsers:

The latest version is deployed at https://axidraw.mutoo.im , you don't need to install or run anything to use it. Just open the web app and plug in the Axidraw on your machine to play it.

The debugger is at https://axidraw.mutoo.im/debugger.html if you want to play with low-level ebb command.

The composer is at https://axidraw.mutoo.im/composer.html for ppl wondering how the pen plotter singing.

## Run locally

Make sure you have node 12+ and yarn installed. Then checkout the repo and run `yarn` to install all the dependencies.

```
$ yarn
```

### Self-signed cert

In order to use WebUSB on the browser, you have to generate a self-signed cert on your own:

```
bash ./scripts/create-cert.sh
```

This is required even you are running it locally. This command will generate a `CA.pem` and `localhost.crt` in the `server/cert` folder.

Please import the `CA.pem` to your system (Keychain on macOS or browser trust list).

The local server will use the `localhost.crt` and `localhost.key` to host the website at

```
https://localhost:8443
```

The cert generation script will also provide extra DNS including your hostname, and a wildcard dns address with your LAN ip (in case you don't have mDNS service in your OS):

```
# e.g. your hostname is raspberry-pi.local
# and your LAN ip is 192.168.3.14
https://raspberry-pi:8443
http://192.168.3.14.nip.io:8433
```

This very handy when you run the web server on Raspberry PI.

### Production build

To run production build locally, run the `yarn build` to build the and, and then `yarn start`:

```
$ yarn build
$ yarn start
```

Then visit the app in your browser with links listed in the section above.

### Development build

Feel free to run dev build if you like to inspect how the app work with devTools:

```
yarn dev
```

## Run on raspberry

What if you plug in the axidraw on a Raspberry PI! No worries, this app also provide a proxy mode via WebSocket, so that you can run a web server to communicate the axidraw and your browsers in different computers.

N.B. The serialport permission has to be set up so that the server can communicate with the device.
