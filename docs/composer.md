# Composer

The composer ([`src/containers/composer`](../src/containers/composer))
plays songs on the plotter by stepping its motors at the pitch of each
note, channel 1 on one motor and channel 2 on the other. The songs are
written in a small note notation, described in
[composer-notation.md](composer-notation.md).

## Playing a song

To prepare a new song, the optional `create-song` Codex skill can turn a
score or numbered notation into a `.song` file, or write an original tune.
See [Creating a song with Codex](composer-notation.md#creating-a-song-with-codex).
Load the resulting file with **Load song**, or drop it on the box under the
Song list in **Midi Commander**.

First, set up the page: its size, orientation and padding. Put the pen at
the origin and line the page up with it, as for plotting. The AxiDraw has
no limit switches, so wherever the pen is when a song starts is the
origin. The song is played from the middle of the page, and the pen keeps
inside the padding.

Then connect a device, and in **Midi Commander**:

- **Song** picks one of the songs that come with the composer, or one
  loaded from a [song file](composer-notation.md#song-files). Its notes
  fill **Channel 1** and **Channel 2**, where they can be edited.
- **Beats Per Minute** sets the tempo, from 10 to 200.
- **Motor Mode** sets the EBB's step mode, from 1 (1/16 steps) to 5 (full
  steps). A note has the same pitch in every mode, but the higher the
  mode, the farther each step moves the pen.
- **PenDown** lowers the pen while the song plays, so that it draws.
- **Randomness** is the chance that the pen carries on at a new note
  instead of turning around. It always turns around at a repeated note, so
  that two notes of the same pitch are heard as two.
- **Swap channels at bars** lets the channels trade motors at bar lines,
  which turns the pen's strokes a quarter turn. **Swap chance** is how
  likely a swap is at each one.
- **Seed** makes the random choices repeatable, and the dice picks
  another.

The preview shows where the pen will go on the page. If the pen has to
turn back part-way through a note to stay inside the padding, Midi
Commander says how often, and suggests a lower motor mode or padding.
**Play** starts the song, and **Stop**, or the PRG button on the AxiDraw,
ends it early. Either way, the pen goes back to the origin.

## How a song is sent to the EBB

[`player.ts`](../src/containers/composer/player.ts) sends a song like this:

1. `R`, then `EM` to enable both motors at the chosen motor mode.
2. Pen up, then the walk from the origin to the middle of the page,
   speeding up and slowing down on the way
   ([`travel`](../src/containers/composer/stage.ts)).
3. Pen down if asked, a 1.5 s rest (an `SM` with no steps), then the
   notes.
4. Pen up, another rest, and the walk back to the origin. The player adds
   up every move the EBB has accepted, so the walk back is the exact
   opposite of their sum, which
   [`player.test.ts`](../src/containers/composer/tests/player.test.ts)
   checks.
5. `R` again, once the motion queue should have finished. The EBB answers
   a queued command as soon as it's queued, so the player keeps its own
   estimate of when the queue will be empty, and waits another 250 ms. An
   `R` that came early would cut the last move short.

Stopping, the PRG button and a command that fails while playing all skip
to step 4.
