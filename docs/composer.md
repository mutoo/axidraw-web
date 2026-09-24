# Composer

[`src/containers/composer`](../src/containers/composer) plays songs on the
plotter by stepping its motors at the pitch of each note, channel 1 on one
motor and channel 2 on the other. The songs are written in a small note
notation, described in [composer-notation.md](composer-notation.md).
[`player.ts`](../src/containers/composer/player.ts) sends a song to the EBB
like this:

1. `R`, then `EM` to enable the motors at the chosen motor mode.
2. Pen up, then the walk from the origin to the middle of the page,
   speeding up and slowing down on the way
   ([`travel`](../src/containers/composer/stage.ts)).
3. Pen down if asked, a 1.5 s rest (an `SM` with no steps), the notes, pen
   up and another rest.
4. The walk back to the origin. The player adds up every step it has sent,
   so the walk back is the exact opposite of the sum.
5. `R` again, once the motion queue should have finished.

Stopping, the PRG button and a failed command all skip to step 4.

These notes record an open problem, found in September 2026.

## Open: the pen doesn't quite get back to the origin

On an AxiDraw with EBB firmware 2.8.1, the pen stops near the origin after
a song, but not on it. Not noted yet: how far off it is, in which
direction, whether that changes from song to song, and the motor mode,
song and PenDown setting it happened with. Worth writing down next time.

### What's known

- The player's sums are right. It counts only the moves the EBB accepts,
  and the walk back undoes their total exactly.
  [`player.test.ts`](../src/containers/composer/tests/player.test.ts)
  checks this, and a logged run on the virtual plotter ended at 0.00,
  0.00 mm.
- Whether the EBB makes exactly the steps it's sent isn't documented for
  2.8.1. The [3.x command reference](https://evil-mad.github.io/EggBot/ebb.html)
  says `SM` is step-limited and ends at an exact step position. The
  [2.x reference](https://evil-mad.github.io/EggBot/ebb2.html) only says
  that steps land on 40 µs ticks and that "the overall proper length for
  the entire move will be correct", which reads as its time.
- The EBB answers a queued command as soon as it is queued, and the queue
  is one command deep at boot. So the player's estimate of when the queue
  finishes can only be late, and it waits another 250 ms before the last
  `R`. `R` runs at once and puts the EBB back in its power-on state: it
  would cut a move short if it came early, and it leaves the motors off
  (the 3.x reference says they start disabled).
- The virtual plotter never loses a step, so none of this shows there.

### Possible causes, most likely first

1. **The motors lose steps.** The plotter is open loop, so a lost step is
   never made up and the walk back misses by as much. Most likely at motor
   modes above 1, where the same notes move the pen 2 to 16 times as fast
   and each new note turns around at that speed: half and full steps at
   audio rates are where steppers resonate and skip. PenDown adds friction.
   The walks used to start and stop dead at 50 mm/s; they now speed up and
   slow down, so they are less likely to be it. Signs: the miss changes
   from song to song, grows with longer songs or higher motor modes, and
   the motors knock or grind.
2. **The song didn't start at the true origin.** The pen goes back to
   where the motors were enabled for the song, not to a corner, as there
   are no limit switches. The `R` after a song leaves the motors limp, so
   the carriage can be nudged before the next one, and enabling them again
   can pull each rotor by up to two full steps (about 0.3 mm of pen travel
   per motor). Signs: small misses that add up over several songs.
3. **The EBB makes a step more or fewer than it's sent** in some moves
   (not ruled out for 2.8.1, see above). Every note is a move of its own,
   so even one step a move adds up. Signs: the miss grows with the number
   of notes, and the EBB's step counters show it (see below).
4. **The last `R` cuts the walk back short.** Unlikely, see above. Signs:
   the pen stops short on the straight line to the origin, and the walk
   back ends abruptly.
5. Less likely: a command failed part way (Results would say so), the page
   or the connection went away during the walk back, or the paper moved
   under the pen with PenDown.

### Telling them apart

- **Only the walks:** motor mode 1, pen up, and a song that is a single
  rest (channel 1 `w0`, channel 2 empty). If the pen still misses, it's
  the walks.
- **Motor modes:** the same song at motor modes 1 and 3. If 3 misses more,
  the notes lose steps.
- **The EBB's step counters:** `EM` zeroes them at the start (2.6.2+) and
  `QS` reads them (2.4.3+). After the walk back they should be 0, 0, which
  would mean the EBB made every step it was sent and any miss is lost steps
  (1 or 2). Anything else means it didn't (3). The last `R` clears them
  too, so the player has to read them before it (see below).

### Proposed changes

1. **Wait for the EBB, then check its counters.** After the walk back, ask
   `QM` (2.4.4+) until nothing is queued or moving, rather than trusting
   the estimate, then read `QS` and compare it with the start. Show the
   result after each song: every step made, or how many steps off. The
   virtual plotter would need a `QM`; it runs its commands one at a time,
   so it can always answer that it's idle.
2. **Don't reset between songs.** Start with `EM` instead of `R` (it still
   sets the motor mode, and zeroes the counters from 2.6.2), clear an old
   press of the PRG button with a `QB`, and leave the motors on after the
   walk back so that they hold the pen at the origin until the next song.
   Disconnecting still resets.
3. **Warn at motor modes above 1** that the pen may not get back exactly.
