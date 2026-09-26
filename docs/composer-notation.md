# Composer notation

The composer's songs are written in a small text notation: the Channel 1 and
Channel 2 boxes in Midi Commander take it, the songs in
[`src/containers/composer/songs`](../src/containers/composer/songs) are
written in it, and so are [song files](#song-files), which Midi Commander
loads. [`parseSong`](../src/containers/composer/utils.ts) reads it. See
[composer.md](composer.md) for how the player sends a song to the EBB.

## At a glance

```
qE5 qE5 qF5 qG5 | qG5 qF5 qE5 qD5 | qC5 qC5 qD5 qE5 | qeE5 eD5 hD5
```

Each note is its length, then its pitch: `qE5` is a quarter note E5, `qeE5` a
dotted quarter, `hD5` a half note. `|` is a bar line. Notes are separated by
spaces, commas or both, and a bar line needs no spaces around it.

## Notes

A note is `<length><pitch>`, with nothing in between. Letters are case
sensitive: lengths are lower case and note names upper case.

### Length

| Symbol | Note          | Beats |
| ------ | ------------- | ----- |
| `w`    | whole         | 4     |
| `h`    | half          | 2     |
| `q`    | quarter       | 1     |
| `e`    | eighth        | 1/2   |
| `s`    | sixteenth     | 1/4   |
| `t`    | thirty-second | 1/8   |

A beat is a quarter note, and Beats Per Minute counts quarter notes. Put
several symbols together and their beats add up, so a dotted note, or a note
tied to another of the same pitch, is one note:

| Written | Beats | Meaning                       |
| ------- | ----- | ----------------------------- |
| `qe`    | 1 1/2 | dotted quarter                |
| `hq`    | 3     | dotted half                   |
| `es`    | 3/4   | dotted eighth                 |
| `st`    | 3/8   | dotted sixteenth              |
| `qs`    | 1 1/4 | a quarter tied to a sixteenth |
| `wwww`  | 16    | four whole notes' worth       |

The order doesn't matter, but the songs write the longest first. There are
no triplets: play three quarter-note triplets as `es es e` (3 + 3 + 2
sixteenths), which fills the same two beats.

### Pitch

A pitch is a note name and an octave, such as `C#4`, or `0` for a rest. A
rest has no octave: `q0`, `qe0`.

The names are `C C# D Eb E F F# G G# A Bb B`, and no others. Sharps go only
on C, F and G, and flats only on E and B, so write the name from this list
that sounds the same:

| Instead of | Write |
| ---------- | ----- |
| `Db`       | `C#`  |
| `D#`       | `Eb`  |
| `Gb`       | `F#`  |
| `Ab`       | `G#`  |
| `A#`       | `Bb`  |

Octaves are numbered as in scientific pitch: `C4` is middle C, `A4` is
440 Hz, and the number goes up at C, so `B3` is the note just below `C4`.
Each octave doubles the pitch: `A3` is 220 Hz and `A5` is 880 Hz.

## Bar lines

`|` goes between two bars. Bar lines are optional, but they're where
"Swap channels at bars" can trade the channels' motors, which turns the pen's
strokes a quarter turn. The notation doesn't count the beats in a bar, so
a bar can be any length, such as a short pickup before the first bar line.

A bar line always falls between two notes of its channel, so a note can't be
held over one. Write it as two notes instead, one each side. The second is
struck again: see bar 48 of
[Canon in D](../src/containers/composer/songs/canon-in-d.ts).

The two channels' bar lines are merged. The channels can trade motors at a
bar line only if neither is holding a note over it (a rest is fine), so keep
the bar lines in the same places in both.

## Channels

Channel 1 drives one motor and channel 2 the other, and both start together.
Channel 2 can be empty. If one channel is shorter, the other carries on
alone once it ends.

A note steps its motor at the note's pitch, one step for each cycle, so an A4
quarter note at 60 BPM is 440 steps. A rest leaves the motor still. The pen
turns around at every new note, or with Randomness it may carry on instead.
It always turns around at a repeated note, which is how two notes of the same
pitch are heard as two. So a note that should sound held has to be written as
one longer note, not as several short ones.

The songs keep between 60 and 2000 Hz, which is B1 to B6. Midi Commander
doesn't check the range, and the EBB could step much faster.

## Writing a song

For help transcribing or arranging a song, see
[Creating a song with Codex](#creating-a-song-with-codex). For a local file
that Midi Commander can load, see [Song files](#song-files).

Bundled songs are TypeScript files in
[`songs`](../src/containers/composer/songs), each built with `createSong`
and `bars` from [`utils.ts`](../src/containers/composer/utils.ts):

```ts
import { bars, createSong } from '../utils';

// Beethoven, Symphony No. 9, finale: the melody over a root-and-fifth bass
export default createSong(
  'Ode to Joy (Beethoven)',
  bars([
    ['qF#5', 'qF#5', 'qG5', 'qA5'],
    ['qA5', 'qG5', 'qF#5', 'qE5'],
    // ...
  ]),
  bars([
    ['hD3', 'hA3'],
    ['hA2', 'hE3'],
    // ...
  ]),
  100,
);
```

- `createSong(title, channel1, channel2, bpm)`. `bpm` is the tempo the
  song is meant for, 88 if left out. Midi Commander takes 10 to 200.
- `bars` takes a list of bars, each a list of notes, and puts a `|` between
  them. Midi Commander shows the song in the same notation, with a comma
  between notes and `|` between bars.
- Name repeated parts and spread them in, as
  [Korobeiniki](../src/containers/composer/songs/korobeiniki.ts) does with
  its tune and bass. A bar of 16 or more notes can be kept on a few lines
  with `// prettier-ignore`, as in
  [Canon in D](../src/containers/composer/songs/canon-in-d.ts).
- Only songs free to share go here, as the repo is public: out of
  copyright, or under a licence that allows it (give the credit it asks
  for, as Canon in D does). Any other song is a [song file](#song-files).
- Export the song from
  [`songs/index.ts`](../src/containers/composer/songs/index.ts). The Song
  list is sorted by the export's name, not by the order in that file, as
  it comes from a module namespace. The first, `canonInD`, is the default.

### From numbered notation (简谱)

| 简谱                             | Notation                                        |
| -------------------------------- | ----------------------------------------------- |
| `1=B`                            | `1` is B, so `1`–`7` are B C# Eb E F# G# Bb     |
| `1` to `7`, `0`                  | the notes of the key, and a rest                |
| a dot above or below             | an octave up or down                            |
| `♯`, `♭`, `♮` before a note      | raise, lower or restore that note               |
| a note on its own                | `q`                                             |
| one line under, two lines under  | `e`, `s`                                        |
| each `-` after a note            | one more `q`: `5 - -` is `hqF#4` in B           |
| a dot after a note               | half as long again: `2·` under one line is `es` |
| an arc over two of the same note | a tie: one note, the lengths added              |
| an arc over different notes      | a slur, which changes nothing here              |

The plain octave is the one around middle C: in `1=C` the plain `1` is
C4. In a key above C, take the plain `1` from below middle C when that keeps
the tune where it's sung, such as B3 in `1=B`. A line under
several notes groups them into a beat; a second line under only some of them
makes just those sixteenths, so `2 1 2` with the second line under `1 2` is
`e s s`, not `s s e`. Zoom in to tell.

[`songs.test.ts`](../src/containers/composer/tests/songs.test.ts) checks
every song:

- each note is a rest or between 60 and 2000 Hz;
- with two channels, both are the same number of beats long and have their
  bar lines in the same places;
- it has bar lines, and every bar is the same length, apart from a pickup
  before the first bar line and the bar after the last.

[`stage.test.ts`](../src/containers/composer/tests/stage.test.ts) also plays
every song on A4 and on the page size with the least room, at several motor
modes, paddings and tempos, and checks that the pen stays inside the
padding.

### Creating a song with Codex

The optional `create-song` skill creates and edits music for this composer.
It can transcribe a score or numbered notation (简谱), arrange a melody and
bass for the two motors, or write an original tune.

The skill lives in
[`.agents/skills/create-song/SKILL.md`](../.agents/skills/create-song/SKILL.md)
and is shared with the repository. It uses the current checkout's files and
does not need a personal installation or a fixed path on your computer.

Open this checkout in Codex and start a request
with `$create-song`. Attach the score or give its source, and specify the
sections, tempo, and voices you want. For example:

```text
$create-song Convert this numbered score into a .song file at 100 BPM.
Keep the full melody in channel 1 and add a simple bass in channel 2.
```

```text
$create-song Write an original eight-bar tune in C major at 120 BPM,
with melody and bass, and save it as songs/morning-walk.song.
```

By default, the result is a local `songs/<title>.song` file, ignored by
Git. Load it with **Load song** or drag it into Midi Commander. To add a
built-in song instead, ask explicitly for a bundled TypeScript song. The
music and its arrangement must be free to redistribute, with any required
credits; the skill also adds its export to `songs/index.ts`.

The skill checks notation, pitch range, bar lengths, channel alignment,
and planned motion. It reports changes such as octave transpositions,
rhythm approximations, or reduced chords. For bundled songs, it runs the
song and stage tests and the TypeScript check. Those tests do not discover
local `.song` files, so the skill parses and checks the actual file
separately. These checks do not require a connected plotter, and passing
them does not prove that a transcription matches the source; review the
melody and any reported simplifications before playing.

## Song files

A song file keeps a song out of the repo, such as one still under
copyright, and Midi Commander loads it to play: drop it on the box under the
Song list, or pick it with Load song. It then shows in the Song list, under
"Loaded from files", until the page is reloaded. A song loaded again takes
the place of the one with its title.

A song file is plain text, and its name ends in `.song`, which
[`.gitignore`](../.gitignore) ignores anywhere in the repo, so one can't be
committed by mistake. Keep them in `songs/` at the root of the repo, or
anywhere else.

```
// Beethoven, Symphony No. 9, finale
title: Ode to Joy (Beethoven)
bpm: 100

channel 1:
qF#5 qF#5 qG5 qA5
| qA5 qG5 qF#5 qE5

channel 2:
hD3 hA3
| hA2 hE3
```

- It is a list of fields, each a name, a colon and its value: `title`
  (needed), `bpm` (a whole number from 10 to 200, 88 if left out),
  `channel 1` (needed) and `channel 2`. The names can be in any case, and
  each is given once, in any order.
- The notes of a channel can go on over the lines after it, up to the next
  field, so one bar a line reads well. The other fields take one line.
- Blank lines, and lines that start with `//`, are left out.
- [`parseSongFile`](../src/containers/composer/song-file.ts) reads it. A
  file it can't read isn't loaded, and Midi Commander says why, such as
  `ode-to-joy.song: Line 7: Can not parse note: qH5`.

## Grammar

```
channel  = { token }             tokens are separated by spaces and commas
token    = note | "|"
note     = length pitch
length   = ("w" | "h" | "q" | "e" | "s" | "t") { "w" | "h" | "q" | "e" | "s" | "t" }
pitch    = "0" | name octave
name     = "C" | "C#" | "D" | "Eb" | "E" | "F" | "F#" | "G" | "G#" | "A" | "Bb" | "B"
octave   = "0" | "1" | ... | "9"
```

A token that doesn't match stops the song from playing, and Midi Commander
names it: `Can not parse note: …`, or `Note has no octave: …`.
