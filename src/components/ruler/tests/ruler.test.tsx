import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Ruler from '../ruler';
import type { RulerVariant } from '../ruler-choice';

// the marks and the numbers of a ruler shown at pxPerMm
const render = (
  pxPerMm: number,
  variant: RulerVariant = 'clear',
  // as wide as it shows in the virtual plotter, 26 px
  thickness = 26 / pxPerMm,
) => {
  const markup = renderToStaticMarkup(
    <svg>
      <Ruler
        variant={variant}
        direction="horizontal"
        thickness={thickness}
        pxPerMm={pxPerMm}
      />
    </svg>,
  );
  const paths = [...markup.matchAll(/<path d="([^"]*)"/g)].map(([, d]) => d);
  return {
    marks: (paths.at(-1)?.match(/M/g) ?? []).length,
    numbers: [...markup.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(
      ([, n]) => n,
    ),
    body: markup.includes('<rect'),
  };
};

describe('ruler', () => {
  it('marks every mm and numbers every cm when shown big enough', () => {
    const { marks, numbers } = render(4);
    expect(marks).toBe(151);
    expect(numbers).toEqual(Array.from({ length: 16 }, (_, cm) => String(cm)));
  });

  it('marks every 5 mm and numbers every 5 cm when shown small', () => {
    const { marks, numbers } = render(1.2);
    expect(marks).toBe(31);
    expect(numbers).toEqual(['0', '5', '10', '15']);
  });

  it('keeps only the cm marks when shown tiny, and no numbers', () => {
    // as in the composer's small page view, where it's 16 mm wide
    const { marks, numbers } = render(0.4, 'clear', 16);
    expect(marks).toBe(16);
    expect(numbers).toEqual([]);
  });

  it('has no body when minimal', () => {
    expect(render(4, 'minimal').body).toBe(false);
    expect(render(4, 'wood').body).toBe(true);
  });
});
