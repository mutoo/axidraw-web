import { describe, expect, it } from 'vitest';
import {
  defaultPageSize,
  findPageSize,
  pageSizeLabel,
  pageSizes,
} from '../page-sizes';

describe('page sizes', () => {
  it('lie landscape on the plotter, with room inside their padding', () => {
    for (const size of pageSizes) {
      expect(size.width, size.id).toBeGreaterThanOrEqual(size.height);
      expect(size.defaultPadding, size.id).toBeGreaterThan(0);
      expect(size.defaultPadding * 2, size.id).toBeLessThan(size.height / 2);
    }
  });

  it('have ids of their own', () => {
    const ids = pageSizes.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keep the ids and paddings the apps had before', () => {
    // virtual plotter windows are opened with these in their URL
    for (const id of ['a3', 'a4', 'a5', 'a6', 'letter']) {
      expect(findPageSize(id).id).toBe(id);
    }
    expect(findPageSize('a4').defaultPadding).toBe(15);
    expect(findPageSize('a5').defaultPadding).toBe(10);
    expect(findPageSize('a6').defaultPadding).toBe(5);
  });

  it('are labelled in the unit they are known by', () => {
    expect(pageSizeLabel(findPageSize('a4'))).toBe('A4 (297 × 210 mm)');
    expect(pageSizeLabel(findPageSize('letter'))).toBe('Letter (11 × 8.5 in)');
    expect(findPageSize('letter')).toMatchObject({
      width: 279.4,
      height: 215.9,
    });
  });

  it('fall back to A4 for a size they do not know', () => {
    expect(defaultPageSize.id).toBe('a4');
    expect(findPageSize('b0')).toBe(defaultPageSize);
    expect(findPageSize(null)).toBe(defaultPageSize);
  });
});
