---
name: create-song
description: Create, transcribe, arrange, or edit songs for the AxiDraw Web composer (Midi Commander), as local .song files or bundled TypeScript songs. Use for adding a song, converting sheet music or numbered notation (简谱), or adapting music to the plotter's two channels. Not for general audio generation or composer engine changes.
---

# Create Song

Produce playable music for AxiDraw Web, preserving the requested melody,
structure, and arrangement scope.

## Project context

Use the AxiDraw Web checkout containing this skill. Its root is three
directories above this skill folder. All paths below are relative to that root.
Read `AGENTS.md` and `docs/composer-notation.md` before writing notes.
The notation document is the maintained source for syntax, numbered-notation
conversion, file format, and song conventions.

Consult these files as needed:

- `src/containers/composer/utils.ts`: `parseNote`, `parseSong`, `bars`,
  `createSong`, `formatChannel`, and `songToSteps`.
- `src/containers/composer/song-file.ts`: the actual `.song` parser.
- `src/containers/composer/songs/korobeiniki.ts`: reusable melody/bass sections.
- `src/containers/composer/songs/canon-in-d.ts`: score attribution and long parts.
- `src/containers/composer/tests/songs.test.ts`: rhythm and pitch checks.
- `src/containers/composer/tests/stage.test.ts`: placement and motion checks.

## Choose the deliverable

Honor an explicit choice of file or bundled song. Otherwise, create a local
`songs/<kebab-case-title>.song`; adding music does not by itself require changing
the built-in song list. Inspect any existing destination before editing it.

This is a public repository. Only bundle music that is free to redistribute,
including the particular arrangement being used, and preserve required credits.
If redistribution rights are unclear, keep the result as a local `.song` file.
Never force-add `.song` files to Git or copy their contents into tracked fixtures.

For existing music, use the supplied score, notation, MIDI, or a reliable source
when available. Record the source and arrangement choices in English comments.
Do not pass off an invented melody, guessed passage, or short excerpt as a
faithful complete transcription. If the version or an unreadable passage is
materially ambiguous, ask a focused question while working on the clear parts.
For an original composition, follow the requested style, length, and mood.

## Transcribe and arrange

Establish the key, meter, tempo, pickup, repeats, and requested sections before
encoding. Preserve repeats and endings from the source. BPM counts quarter
notes; convert a tempo marked in another beat unit accordingly. Use an integer
from 10 to 200. State a chosen tempo if none was supplied.

The plotter supports two simultaneous monophonic voices, one per motor.
Normally put the recognizable melody in channel 1 and a bass line or second
voice in channel 2. Channel 2 can be empty. Reduce chords to a suitable voice
or arpeggio when arranging polyphonic input, and disclose the reduction.

Keep these encoding constraints in mind:

- Use only documented pitch spellings, with an octave on every sounding note.
  Rests use `0` with a duration and no octave.
- Keep sounding notes above 60 and below 2000 Hz (B1 through B6). If needed,
  transpose a coherent phrase or voice by octaves and report the change.
- Duration symbols add: `qe` is a dotted quarter. Merge tied notes into one
  duration when possible; repeated tokens rearticulate the note.
- A note cannot span a bar line in its own channel. Splitting it across the
  line rearticulates it. Account for this when transcribing ties.
- There is no native triplet duration. Use a documented approximation only
  when appropriate and disclose the rhythmic change.
- Align voices by elapsed beats, including pickup rests. Keep bar lines at
  matching times so channel swapping works. Normally make both voices the
  same total length, using rests where one voice is silent.
- Count each bar, not just the whole song. A pickup or final partial bar is
  valid. Preserve an intentional meter change in a local song; do not distort
  the music merely to satisfy the bundled songs' uniform-bar convention.

When reading 简谱, inspect octave dots, duration dots, underlines, accidentals,
and ties separately. A second underline may apply to only part of a group.
Use the document's key and octave guidance rather than treating scale degrees
as fixed C-major pitches.

## Write the song

For a local file, use the documented fields `title`, `bpm`, `channel 1`, and
optional `channel 2`, with one bar per line and `|` between bars. Comments must
occupy their own `//` lines; inline comments are not part of the file format.
Use comments to identify the source, covered sections, and any simplifications.

For a bundled song, add `src/containers/composer/songs/<name>.ts` using
`createSong(title, bars(...), bars(...), bpm)` (or `[]` for an empty second
channel). Factor repeated sections when helpful and export it from
`src/containers/composer/songs/index.ts`. The UI sorts by export name; consider
whether a new name would change the default selection. Keep credit and licence
information with the arrangement.

## Validate the actual output

Use the repository's Node and pnpm versions. Do not connect to or play a physical
plotter just to validate a song.

For bundled songs, run:

```bash
pnpm test --run src/containers/composer/tests/songs.test.ts src/containers/composer/tests/stage.test.ts
pnpm exec tsc -b
```

For a local file, existing song tests do **not** discover `songs/*.song`.
Validate the new file itself with `parseSongFile`, then `parseSong` and
`songToSteps` at its intended BPM. Use a temporary Vitest test in the checkout
when needed so Vite resolves `@/` aliases and extensionless imports; plain Node
cannot directly load this application module graph. Read the actual file from
disk rather than copying its music into the test, and remove only the temporary
test you created after running it.

Check the parsed output for nonempty channel 1, the pitch range, per-bar beat
counts, channel totals, and bar-line positions. Compare these to the intended
meter and pickup, allowing a deliberately shorter voice or changing meter only
when that is part of the arrangement. Reuse `placeSong` and the assertions in
`stage.test.ts` for a representative page at the intended tempo to check finite
motion, total duration, and placement inside the padding. Report any mid-note
turns separately; they can affect articulation even when bounds are valid.

Finally, compare representative phrases and section boundaries to the source.
Passing structural checks does not prove musical fidelity.

Deliver a link to the song, its tempo and arrangement scope, any material
transpositions or approximations, and the checks actually run. For local files,
mention that Midi Commander loads them through **Load song** or drag and drop.
