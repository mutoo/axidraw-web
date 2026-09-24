import type { RawSong } from './utils';
import {
  BAR_LINE,
  MAX_BPM,
  MIN_BPM,
  parseNote,
  tokenizeChannel,
} from './utils';

// songs kept as files end in this, and git ignores them
export const SONG_FILE_EXTENSION = '.song';

const FIELDS = ['title', 'bpm', 'channel 1', 'channel 2'] as const;
type Field = (typeof FIELDS)[number];
// only the notes go on over more than one line
const MULTILINE: Field[] = ['channel 1', 'channel 2'];

const FIELD_LINE = /^([a-z][a-z0-9 ]*):(.*)$/i;

type Line = { at: number; text: string };

const lineError = (at: number, message: string, cause?: unknown) =>
  new Error(`Line ${at}: ${message}`, { cause });

/**
 * Reads a song file: its title, maybe its tempo, and the notes of one or two
 * channels, as described in docs/composer-notation.md.
 */
export const parseSongFile = (text: string): RawSong => {
  const fields = new Map<Field, Line[]>();
  let current: Field | null = null;
  for (const [i, raw] of text.split(/\r?\n/).entries()) {
    const line = { at: i + 1, text: raw.trim() };
    if (!line.text || line.text.startsWith('//')) continue;
    const match = FIELD_LINE.exec(line.text);
    if (match) {
      const name = match[1].trim().replace(/\s+/g, ' ').toLowerCase();
      const field = FIELDS.find((known) => known === name);
      if (!field) {
        throw lineError(line.at, `unknown field "${match[1].trim()}"`);
      }
      if (fields.has(field)) {
        throw lineError(line.at, `"${field}" is given twice`);
      }
      fields.set(field, [{ at: line.at, text: match[2].trim() }]);
      current = field;
    } else if (current && MULTILINE.includes(current)) {
      fields.get(current)?.push(line);
    } else {
      throw lineError(line.at, 'expected a field, such as "title: …"');
    }
  }

  const title = fields.get('title')?.[0].text;
  if (!title) throw new Error('The song has no title.');

  let bpm: number | undefined;
  const tempo = fields.get('bpm')?.[0];
  if (tempo) {
    bpm = Number(tempo.text);
    if (!(Number.isInteger(bpm) && bpm >= MIN_BPM && bpm <= MAX_BPM)) {
      throw lineError(
        tempo.at,
        `bpm should be a whole number from ${MIN_BPM} to ${MAX_BPM}`,
      );
    }
  }

  const channel = (field: Field) =>
    (fields.get(field) ?? []).flatMap(({ at, text: notes }) =>
      tokenizeChannel(notes).map((token) => {
        if (token !== BAR_LINE) {
          try {
            parseNote(token);
          } catch (e) {
            throw lineError(at, (e as Error).message, e);
          }
        }
        return token;
      }),
    );
  const channel1 = channel('channel 1');
  if (!channel1.some((token) => token !== BAR_LINE)) {
    throw new Error('The song has no notes in "channel 1".');
  }
  return { title, channel1, channel2: channel('channel 2'), bpm };
};
