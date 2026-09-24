# Virtual plotter

The virtual plotter is an AxiDraw in a browser window. It runs an emulated
EBB ([`src/containers/virtual/plotter`](../src/containers/virtual/plotter)),
draws what the pen would draw, and hums like the motors would. The plotter
app, the debugger and the composer drive it like a real AxiDraw.

## Opening it

In the device connector, pick **Virtual Plotter**, then the EBB firmware
version and the paper, and click **Create**. The virtual plotter opens in a
window of its own, always the same one: connecting again finds the window
that's open, with its drawing and its pen where they were, as on a real
plotter. Only a different paper size starts a blank sheet.

The plotter app disconnects when a plot finishes, so plotting again takes
another **Create**. The drawing stays on the paper for the next plot, over
the last one, until you clear it.

## The window

The toolbar, from the left:

- **Status**: _Connected_, _Connecting…_ while it waits for the main window,
  or _Disconnected_. Its tooltip says why it disconnected, and so does a
  toast. The window's title says the same, to tell it apart in the list of
  windows.
- **Paper**: any of the page sizes every app shares
  ([`src/plotter/page-sizes.ts`](../src/plotter/page-sizes.ts)): ISO A1 to
  A6 and B4 to B6, US, cards and art paper, and the plot area of each
  AxiDraw, landscape as it lies on the plotter. Another size is a blank
  sheet. That, and **Clear**, can be undone from the toast for 10 seconds.
- **Ruler**: a 15 cm ruler along the top and the left edges of the paper,
  from its corner, which is the origin. It's clear, wood, steel, yellow or
  minimal, or there's none. It marks every mm and numbers every cm when
  it's shown big enough, and fewer as the paper shrinks. The choice is the
  same in every window of the app, the composer's too.
- **Pen**: its color, from the swatches or any other, and its tip, 0.3 to
  2 mm. Changing them is swapping the pen: what's drawn stays as it was,
  and the new pen draws from where the old one stopped. Plot a layer, swap
  the pen, plot the next.
- **Speed**: 1×, 2×, 5× or 10× real time, or _Instant_, which finishes every
  move and delay at once. It can be changed in the middle of a plot. Where
  the main window keeps time itself, it still waits in real time: the
  composer waits out a song at its real length before its last `R`.
- **Sound** on or off. A browser only lets a window play sound once it has
  been clicked, and this window opens without a click, so the sound plays
  through the main window, which was clicked to open it
  ([`sound.ts`](../src/containers/virtual/sound.ts)). It's on from the
  start, and moves along when the main window reloads and connects again.
  With no main window left, a click in this window brings the sound back.
- **PRG**: presses the EBB's PRG button, which the next `QB` reports: the
  plotter app pauses, the composer stops. It stays lit until it's read.
- **Clear** the paper.
- **PNG**: a picture of the paper at 300 dpi.
- **SVG**: the drawing in mm, the size of the paper, with a polyline per
  stroke in its color and width. The plotter app can load it again.

The status bar shows the EBB version, where the pen is in mm from the top
left corner of the paper, whether the pen is up or down, and who has the
carriage:

- _Controlled by the main window_ while commands come in,
- _Idle_ once none has for a few seconds,
- _Free_ when it can be moved by hand, see below.

## Free mode

With the pen up and no command for 3 seconds (`IDLE_DELAY`), the carriage is
free: drag it, or press the arrow keys to push it 1 mm (10 mm with Shift).
It stays on the paper. The motors turn with it and hum at the rate their
steps go by. A command takes the carriage back at once, and ends the drag:
it takes a new one once the plotter is free again.

As on a real AxiDraw, pushing the carriage doesn't change the EBB's step
counters, since no step is made. So the next plot starts from where the pen
was left, which is how the paper's corner, or any other point, becomes the
origin.

## What the EBB does

The virtual EBB knows `EM`, `HM`, `LM`, `QB`, `QS`, `R`, `SC`, `SM`, `SP`,
`SR`, `TP` and `V`, and answers any other command with an error. It runs
them one at a time, in order, so a query waits for the moves before it,
where a real EBB would answer at once. It never loses a step.

## How it talks to the main window

The two windows post messages to each other
([`src/communication/device/virtual.ts`](../src/communication/device/virtual.ts)
on the main window's side,
[`host-link.ts`](../src/containers/virtual/host-link.ts) on the virtual
plotter's). Every connection has a session id, which every message carries,
so messages of an earlier connection are ignored.

1. The main window opens the virtual plotter's window, by name, with the
   version, the paper and the session in its URL
   (`#virtual?ebb=2.7.0&paper=a4&session=…`). If the window is open
   already, the main window keeps it and posts _connect_ with them instead.
   It posts _connect_ again every half second until it gets an answer, as a
   window that's still loading misses messages.
2. The virtual plotter answers _started_, and the main window _connected_.
   Then come _commands_, each answered by a _message_ with the EBB's
   response.
3. Either side posts _disconnected_ when it hangs up or its page goes away.
   A window that's unloading posts with no source, so each side takes a
   _disconnected_ by its session alone. In case the message never comes,
   each side also checks every second or so whether the other's window has
   closed or shows another page, and a main window that gets no answer
   gives up after 30 seconds.

Another window of the app can connect to the virtual plotter while it's
connected; the virtual plotter tells the first one it has been let go. Once
a session is over, the virtual plotter drops the commands of it that haven't
started, and no longer answers the rest, and the main window fails the
commands still waiting for an answer rather than letting them time out.
