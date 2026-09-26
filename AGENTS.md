# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex and others) when working with code in this repository.

AxiDraw Web drives an AxiDraw pen plotter from the browser. It talks to the
plotter's controller, the EiBotBoard (EBB), over WebUSB or Web Serial,
through a WebSocket proxy (`server/`), or to an emulated plotter in a popup
window.
[README.md](README.md) describes the apps for users. [docs/](docs) holds the
details: [connecting](docs/connecting.md),
[virtual plotter](docs/virtual-plotter.md),
[composer](docs/composer.md), [composer notation](docs/composer-notation.md)
and [R-tree](docs/rtree.md).

## Commands

Node 24 (`.nvmrc`) and pnpm 12 (`packageManager` in `package.json`).

```bash
pnpm install
pnpm dev                                            # http://localhost:5173
pnpm test --run                                     # all tests once, ~20 s (mostly composer/tests/stage.test.ts)
pnpm test --run src/plotter/tests/planner.test.ts   # one file
pnpm test --run -t "revertLineGroup"                # tests whose name matches
pnpm exec tsc -b                                    # type-check the app and the server
pnpm lint                                           # type-aware ESLint
pnpm build                                          # tsc -b && vite build, into dist/
pnpm run server                                     # HTTPS server and WebSocket proxy on :8443
```

- Without `--run`, `pnpm test` starts Vitest in watch mode in an interactive
  terminal.
- `tsc` is TypeScript 7, the native compiler (`@typescript/native`). The
  `typescript` package is TypeScript 6, with its binary renamed `tsc6`, kept
  only because typescript-eslint needs its JS API. This is on purpose.
- `pnpm run server` serves `dist/`, so build first. It exits without the
  certificate that `bash scripts/create-cert.sh` writes to `server/cert/`
  (gitignored, as it holds private keys).
- CI runs neither tests nor lint: the only workflow is a GitHub Pages deploy
  started by hand. The pre-commit hook runs `eslint --cache --fix` on staged
  `.ts`/`.tsx` files, and nothing else.
- The code follows `.prettierrc`, but nothing runs Prettier, and a few files
  aren't Prettier-clean. Keep reformatting of lines you didn't change out of
  diffs.
- `pnpm-workspace.yaml` only resolves versions published at least 14 days
  ago, lists the dependencies allowed to run install scripts, and patches
  `@serialport/bindings-interface`.

## Architecture

There are four apps, hash-routed and lazy-loaded in
`src/containers/app/app.tsx`: the plotter (`/`), `/composer`, `/debugger`, and
`/virtual`, the virtual plotter's popup, which the page switcher leaves out.

### Talking to the EBB

- **Commands** (`src/communication/ebb/commands/`) are made with
  `createCommand(cmd, title, create, parseParams, options)`. `create` is a
  generator: its first `yield` is the text to send, then it's fed the
  response bytes as they arrive, yielding `{ consumed }` until it returns
  `{ result, consumed, remain }`. `readUntil` and `messages/ok.ts` do most of
  the parsing. `options.version` is the oldest firmware with the command,
  checked before sending. The debugger lists every export of `ebb/index.ts`,
  so a command exported there shows up in it.
- **Devices** (`src/communication/device/`): `usb.ts`, `serial.ts`,
  `websocket.ts` and `virtual.ts` each provide a raw `IDevice`, and
  `createDeviceBind` in `utils.ts` wraps it into the `IDeviceConnector`
  every app uses: `executeCommand(cmd, ...params)`, connected and
  disconnected events, and the firmware `version`. Connecting sends `R`,
  then `V` for the version.
- **Responses** go through `handleEBBMessages` (`ebb/messages/ebb.ts`), which
  hands incoming bytes to the oldest waiting command, so responses are
  matched to commands strictly in the order they were sent. A response
  starting with `!` is an error and rejects that command. A command fails
  after 60 s, and every waiting command fails at once when the device
  disconnects.
- Commands marked `EXECUTION_FIFO` (`SM`, `LM`, `SP`, …) go into the EBB's
  motion queue and are answered once queued, not once done. Code that has to
  wait for the motors, such as the end of a plot or the composer's last `R`,
  keeps its own estimate of when the queue empties and waits it out.
- `src/components/device-connector/`, with `src/hooks/device.ts`, is the
  connect UI the plotter, debugger and composer share. Each app gets the
  connector through `onConnected`.

### Plotting an SVG (`src/plotter/`)

1. `svg/svg-to-lines.ts` walks the SVG as rendered in the page and turns each
   supported element into line segments. It needs `getCTM()`, so a real DOM.
   `svg/path/` parses path data.
2. `plan()` in `planner.ts` joins segments within the Connected tolerance,
   simplifies each stroke within Flatten (Douglas–Peucker), optionally
   reorders the strokes nearest first (`reorderLineGroups`, over `rtree/`),
   and returns `Motion[]`: pen-up and pen-down lines in mm, from the origin
   and back to it.
3. `plot()` in `plotter.ts` is an async generator that sends the motions: `SM`
   at constant speed, or `LM` with acceleration and cornering
   (`motion/const-acceleration.ts`). Before each motion it checks `QB`, the
   PRG button, and a control signal. To pause it yields, and `next(action)`
   resumes or stops it. It reads its settings from MobX boxes as it goes, so
   a change applies in the middle of a plot.
4. `estimator.ts` repeats the motion loop of `plotter.ts` to add up the time
   without a device. Change the two together.

The motors drive mixed axes, `a1 = x + y` and `a2 = x − y`; `src/math/ebb.ts`
converts between them and from mm to steps. SVG units are 96 px per inch
(`src/math/svg.ts`). `src/plotter/page-sizes.ts` is the one list of page sizes
all the apps use.

The plotter app keeps its state in three MobX presenters
(`src/containers/plotter/presenters/`: page, planning and work), created once
at module level in `context.ts` and read by `observer` components. The
composer and the debugger use plain React state.

### The virtual plotter (`src/containers/virtual/`)

It is a second EBB implementation, emulating the firmware, and shares only
constants with `src/communication/ebb`. Its commands
(`virtual/plotter/commands/`) are async generators over a MobX context: what
one yields is the EBB's response, and it awaits its motion before or after
that. They run one at a time, in order, dispatched by the `switch` in
`virtual/plotter/index.ts`; any other command answers with an error.
`host-link.ts` is its end of a postMessage session with the main window, and
`src/communication/device/virtual.ts` is the main window's end.

A command both sides should know needs the host side in
`src/communication/ebb/commands/` with its export in `index.ts`, the emulator
side in `virtual/plotter/commands/` with a case in that `switch`, and a place
in the list of known commands in `docs/virtual-plotter.md`.

### The composer (`src/containers/composer/`)

`utils.ts` parses the note notation (`parseSong`), `song-file.ts` reads
`.song` files, `stage.ts` places a song on the page and plans its steps, and
`player.ts` sends them. [docs/composer.md](docs/composer.md) walks through the
player.

### The server (`server/`)

Express over HTTPS on port 8443. It serves `dist/`, offers the CA certificate
at `/ca`, and passes EBB commands between a WebSocket at `/axidraw` and the
serial port (`ws.ts`, `serial-port.ts`). Node runs its TypeScript directly by
stripping the types, so imports need `.ts` extensions and only erasable syntax
works: no `enum`, `namespace` or parameter properties (`tsconfig.node.json`
sets `erasableSyntaxOnly`). It shares only types with `src/`: the message
protocol in `src/communication/device/webscoket-type.ts` (sic). The rest of
`src/` uses the `@/` alias and extensionless imports, which Node can't load.

## Conventions

- Tests sit in `tests/` folders next to the code and run in Node, with no DOM
  library. Stub browser globals with `vi.stubGlobal`
  (`device/tests/virtual.test.ts`, `ruler/tests/ruler-choice.test.ts`),
  render components with `renderToStaticMarkup`
  (`ruler/tests/ruler.test.tsx`), and stand in for `DOMMatrix` with a small
  class (`svg/tests/path-to-lines.test.ts`).
- Call `usePageBusy(reason)` (`src/hooks/page-busy.ts`) while leaving the page
  would lose something, such as a plot in progress or a song playing. The
  page switcher then asks before it leaves.
- Styling mixes CSS Modules (`*.module.css`), Tailwind CSS 4 utilities, and
  shadcn/ui components in `src/components/ui` (`components.json`). Follow the
  file you're in.
- The README and docs describe behaviour in detail, down to every command the
  virtual EBB knows and the order the composer's player sends its commands.
  Update them in the same change as the behaviour, in the same plain, short
  sentences.
- Commits follow Conventional Commits, with a scope where one fits:
  `feat(composer): …`, `fix(device): …`, `perf(rtree): …`. The subject is
  plain lower-case English, and the body says what changed and why.

## Gotchas

- The repo is public, so songs in `src/containers/composer/songs/` must be
  free to share: out of copyright, or under a licence that allows it, with
  the credit it asks for. Any other song is a `.song` file, which Midi
  Commander loads. `*.song` is gitignored everywhere; keep them in `songs/`
  at the root, and never force-add one. A bundled song is exported from
  `songs/index.ts` and has to pass `songs.test.ts` and `stage.test.ts`.
- `DebugRtree` (`src/containers/plotter/components/workspace/debug.tsx`) is
  unmounted on purpose: it's mounted by hand to debug the R-tree. It isn't
  dead code.
- The apps speak EBB firmware 2.x. The `R` command waits for the two `OK`s that
  firmware 2.4.3 to 2.8.1 answer with, the second from the reset clearing the
  step counters with `CS`. Firmware 3.x isn't supported yet: it answers with
  one, so it can't connect. The README's EBB firmware section says what each
  version can do; keep it, the firmware note in the device connector, and
  `firmwareProblem` in `src/plotter/plotter.ts` in step.
