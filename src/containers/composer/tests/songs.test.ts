import { describe, expect, it } from 'vitest';
import * as songs from '../songs';
import { BAR_LINE, formatChannel, parseNote, parseSong } from '../utils';

const notesOf = (channel: string[]) =>
  channel.filter((note) => note !== BAR_LINE);

const sumBeats = (channel: string[]) =>
  notesOf(channel).reduce((sum, note) => sum + parseNote(note).beats, 0);

const barlinesOf = (channel: string[]) =>
  parseSong(formatChannel(channel), '').barlines ?? [];

describe('songs', () => {
  it.each(Object.entries(songs))('%s has playable notes', (_, song) => {
    for (const note of notesOf([...song.channel1, ...song.channel2])) {
      const { frequency } = parseNote(note);
      // a rest, or a note the motors can sing
      expect(frequency === 0 || (frequency > 60 && frequency < 2000)).toBe(
        true,
      );
    }
  });

  const withTwoChannels = Object.entries(songs).filter(
    ([, song]) => song.channel2.length > 0,
  );

  it.each(withTwoChannels)('%s has channels of the same length', (_, song) => {
    expect(sumBeats(song.channel2)).toBe(sumBeats(song.channel1));
  });

  it.each(withTwoChannels)(
    '%s has its bar lines in the same places in both channels',
    (_, song) => {
      expect(barlinesOf(song.channel2)).toEqual(barlinesOf(song.channel1));
    },
  );

  it.each(Object.entries(songs))(
    '%s has bars of the same length',
    (_, song) => {
      const barlines = barlinesOf(song.channel1);
      expect(barlines.length).toBeGreaterThan(0);
      // all but the pickup before the first bar line and the bar after the last
      const lengths = barlines.slice(1).map((at, i) => at - barlines[i]);
      expect(new Set(lengths).size).toBeLessThanOrEqual(1);
    },
  );
});
