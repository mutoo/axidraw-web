import { describe, expect, it } from 'vitest';
import { parseSongFile } from '../song-file';
import { BAR_LINE, formatChannel, parseSong } from '../utils';

const file = (...lines: string[]) => lines.join('\n');

describe('parseSongFile', () => {
  it('reads the title, the tempo and both channels', () => {
    const song = parseSongFile(
      file(
        '// Beethoven, Symphony No. 9',
        'title: Ode to Joy',
        'bpm: 100',
        '',
        'channel 1:',
        'qF#5 qF#5 qG5 qA5',
        '| qA5, qG5, qF#5, qE5',
        '',
        'channel 2: hD3 hA3',
        '// the bass',
        '| hA2 hE3',
      ),
    );
    expect(song).toEqual({
      title: 'Ode to Joy',
      bpm: 100,
      channel1: [
        'qF#5',
        'qF#5',
        'qG5',
        'qA5',
        BAR_LINE,
        'qA5',
        'qG5',
        'qF#5',
        'qE5',
      ],
      channel2: ['hD3', 'hA3', BAR_LINE, 'hA2', 'hE3'],
    });
  });

  it('leaves out the tempo and channel 2 when they are not given', () => {
    const song = parseSongFile(file('title: Hum', 'channel 1: qC5 qD5'));
    expect(song.bpm).toBeUndefined();
    expect(song.channel2).toEqual([]);
  });

  it('takes field names in any case and a title with a colon', () => {
    const song = parseSongFile(
      file('Title: Star Wars: Main Title', 'CHANNEL  1: qG4', 'BPM: 104'),
    );
    expect(song.title).toBe('Star Wars: Main Title');
    expect(song.bpm).toBe(104);
    expect(song.channel1).toEqual(['qG4']);
  });

  it('reads Windows line endings', () => {
    const song = parseSongFile('title: Hum\r\nchannel 1:\r\nqC5 |\r\nqD5\r\n');
    expect(song.channel1).toEqual(['qC5', BAR_LINE, 'qD5']);
  });

  it('gives notes that play as written', () => {
    const song = parseSongFile(
      file('title: Hum', 'channel 1: qC5 qD5 | hE5', 'channel 2: hC3 | hG3'),
    );
    const parsed = parseSong(
      formatChannel(song.channel1),
      formatChannel(song.channel2),
    );
    expect(parsed.barlines).toEqual([2]);
    expect(parsed.channel1.map(({ beats }) => beats)).toEqual([1, 1, 2]);
  });

  it.each([
    [file('channel 1: qC5'), 'The song has no title.'],
    [file('title:', 'channel 1: qC5'), 'The song has no title.'],
    [file('title: Hum'), 'The song has no notes in "channel 1".'],
    [
      file('title: Hum', 'channel 1: | |'),
      'The song has no notes in "channel 1".',
    ],
    [file('title: Hum', 'tempo: 90'), 'Line 2: unknown field "tempo"'],
    [file('title: Hum', 'title: Hum'), 'Line 2: "title" is given twice'],
    [file('qC5 qD5', 'title: Hum'), 'Line 1: expected a field'],
    [file('title: Hum', 'and more'), 'Line 2: expected a field'],
    [file('title: Hum', 'bpm: 90', '120'), 'Line 3: expected a field'],
    [file('title: Hum', 'bpm: fast'), 'Line 2: bpm should be a whole number'],
    [file('title: Hum', 'bpm: 88.5'), 'Line 2: bpm should be a whole number'],
    [file('title: Hum', 'bpm: 400'), 'Line 2: bpm should be a whole number'],
    [
      file('title: Hum', 'channel 1:', 'qC5 qD5', 'qE5 qH5'),
      'Line 4: Can not parse note: qH5',
    ],
    [
      file('title: Hum', 'channel 1: qC5', 'channel 2: qC'),
      'Line 3: Note has no octave: qC',
    ],
  ])('refuses %j', (text, message) => {
    expect(() => parseSongFile(text)).toThrow(message);
  });
});
