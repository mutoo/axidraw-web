import { useId } from 'react';
import type { RulerVariant } from './ruler-choice';

// a 15 cm ruler
export const RULER_LENGTH = 150; // mm
// the ruler goes on a little past 0 and 15 cm
export const RULER_END = 4; // mm
// how far a ruler reaches along the page from its corner
export const RULER_REACH = RULER_LENGTH + RULER_END; // mm

type Look = {
  // the colors across the body, from the edge with the marks out, or no body
  body: string[] | null;
  outline: string;
  ink: string;
  grain?: boolean;
};

const looks: Record<RulerVariant, Look> = {
  clear: {
    body: ['rgb(240 249 255 / 0.75)', 'rgb(224 242 254 / 0.55)'],
    outline: 'rgb(14 116 144 / 0.45)',
    ink: '#0f172a',
  },
  wood: {
    body: ['#ebcd97', '#dab176', '#c9985a'],
    outline: '#a3733c',
    ink: '#3b2412',
    grain: true,
  },
  steel: {
    body: ['#f4f5f7', '#d3d7dd', '#a7aeb8', '#e5e8ec'],
    outline: '#6b7280',
    ink: '#111827',
  },
  yellow: {
    body: ['#fde047', '#facc15'],
    outline: '#ca8a04',
    ink: '#1c1917',
  },
  minimal: {
    body: null,
    outline: 'none',
    ink: '#8a8a8a',
  },
};

// where the wood grain runs, across the body
const GRAIN = [0.18, 0.34, 0.57, 0.79];

/**
 * A 15 cm ruler along the top (horizontal) or the left (vertical) edge of a
 * page, in mm from the page's top left corner: 0 is at the corner, the edge
 * with the marks lies on the page's edge, and the body is off the page.
 * `pxPerMm` is how big it's shown, which decides how fine its marks can be.
 */
const Ruler = ({
  variant,
  direction,
  thickness,
  pxPerMm,
}: {
  variant: RulerVariant;
  direction: 'horizontal' | 'vertical';
  // how far the ruler reaches off the page
  thickness: number; // mm
  pxPerMm: number;
}) => {
  const gradientId = useId();
  const look = looks[variant];
  const vertical = direction === 'vertical';
  // from along the ruler and off the page, to the page's x and y
  const at = (along: number, off: number) =>
    vertical ? `${-off} ${along}` : `${along} ${-off}`;

  // a mark every mm while they're 3 px apart, or every 5 or 10 mm
  const step = pxPerMm >= 3 ? 1 : pxPerMm * 5 >= 3 ? 5 : 10;
  const markLength = (mm: number) =>
    thickness * (mm % 10 === 0 ? 0.42 : mm % 5 === 0 ? 0.3 : 0.18);
  let marks = '';
  for (let mm = 0; mm <= RULER_LENGTH; mm += step) {
    marks += `M${at(mm, 0)}L${at(mm, markLength(mm))}`;
  }

  // every cm is numbered while there's room, or every 5 cm
  const numberEvery = pxPerMm * 10 >= 20 ? 10 : 50;
  const fontSize = Math.min(thickness * 0.4, 11 / pxPerMm);
  const numbers: { mm: number; x: number; y: number }[] = [];
  if (fontSize * pxPerMm >= 5) {
    // just past the end of the cm mark
    const off = markLength(0) + thickness * 0.06 + fontSize / 2;
    for (let mm = 0; mm <= RULER_LENGTH; mm += numberEvery) {
      numbers.push(vertical ? { mm, x: -off, y: mm } : { mm, x: mm, y: -off });
    }
  }

  const body = vertical
    ? {
        x: -thickness,
        y: -RULER_END,
        width: thickness,
        height: RULER_LENGTH + RULER_END * 2,
      }
    : {
        x: -RULER_END,
        y: -thickness,
        width: RULER_LENGTH + RULER_END * 2,
        height: thickness,
      };

  return (
    <g>
      {look.body && (
        <>
          <defs>
            {/* across the body, from the edge on the page out */}
            <linearGradient
              id={gradientId}
              x1={vertical ? 1 : 0}
              y1={vertical ? 0 : 1}
              x2={0}
              y2={0}
            >
              {look.body.map((color, i) => (
                <stop
                  key={color}
                  offset={i / Math.max(look.body!.length - 1, 1)}
                  stopColor={color}
                />
              ))}
            </linearGradient>
          </defs>
          <rect
            {...body}
            rx={Math.min(1.5, thickness * 0.08)}
            fill={`url(#${gradientId})`}
            stroke={look.outline}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
      {look.grain && (
        <path
          d={GRAIN.map(
            (f) =>
              `M${at(-RULER_END, f * thickness)}L${at(RULER_REACH, f * thickness)}`,
          ).join('')}
          stroke={look.ink}
          strokeOpacity={0.12}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      )}
      {!look.body && (
        // the edge the marks hang from
        <path
          d={`M${at(0, 0)}L${at(RULER_LENGTH, 0)}`}
          stroke={look.ink}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      )}
      <path
        d={marks}
        stroke={look.ink}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        shapeRendering="crispEdges"
      />
      <g
        fill={look.ink}
        fontSize={fontSize}
        fontWeight={500}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {numbers.map(({ mm, x, y }) => (
          <text
            key={mm}
            x={x}
            y={y}
            // the vertical ruler reads from bottom to top
            transform={vertical ? `rotate(-90 ${x} ${y})` : undefined}
          >
            {mm / 10}
          </text>
        ))}
      </g>
    </g>
  );
};

// the rulers along the top and the left edges of a page
export const Rulers = ({
  variant,
  thickness,
  pxPerMm,
}: {
  variant: RulerVariant;
  thickness: number; // mm
  pxPerMm: number;
}) => (
  <g aria-hidden="true" pointerEvents="none">
    <Ruler
      variant={variant}
      direction="vertical"
      thickness={thickness}
      pxPerMm={pxPerMm}
    />
    <Ruler
      variant={variant}
      direction="horizontal"
      thickness={thickness}
      pxPerMm={pxPerMm}
    />
  </g>
);

export default Ruler;
