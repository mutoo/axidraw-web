import classNames from 'clsx';
import type { ReactNode } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { Rulers, RULER_REACH } from '@/components/ruler/ruler';
import { RULER_OFF, useRulerChoice } from '@/components/ruler/ruler-choice';
import { PAGE_ORIENTATION_PORTRAIT } from '@/containers/plotter/presenters/page';
import type { PageSize } from '@/plotter/page-sizes';
import { pageSizeLabel } from '@/plotter/page-sizes';

// the desk around the page, in mm
const DESK = 15;
// the rulers along the top and left edges, and the desk they lie on, in mm
const RULER_WIDTH = 16;
const RULER_DESK = 20;

/**
 * The page with its padding, the origin where the pen starts and ends, and
 * the middle where it plays. As in the plotter, a portrait page is the same
 * paper turned for the view, so its origin is at the top right. `underlay`
 * and `children` are drawn below and above the rest, in mm from the origin.
 */
const PagePreview = ({
  pageSize,
  orientation,
  padding,
  className,
  underlay,
  children,
}: {
  pageSize: PageSize;
  orientation: string;
  padding: number;
  className?: string;
  underlay?: ReactNode;
  children?: ReactNode;
}) => {
  const shadowId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  // how big the view shows, to tell how fine the rulers' marks can be
  const [shown, setShown] = useState<{ width: number; height: number }>();
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setShown({ width, height });
    });
    observer.observe(svg);
    return () => {
      observer.disconnect();
    };
  }, []);
  const [ruler] = useRulerChoice();
  const portrait = orientation === PAGE_ORIENTATION_PORTRAIT;
  // along the plotter's x and y
  const { width, height } = pageSize;
  const view = portrait ? { width: height, height: width } : { width, height };
  const middle = { x: width / 2, y: height / 2 };
  // the rulers lie along the top and left of the page as it's seen
  const rulers = ruler !== RULER_OFF;
  const desk = rulers ? RULER_DESK : DESK;
  const box = {
    x: -desk,
    y: -desk,
    width:
      (rulers ? Math.max(view.width, RULER_REACH) : view.width) + desk + DESK,
    height:
      (rulers ? Math.max(view.height, RULER_REACH) : view.height) + desk + DESK,
  };
  const pxPerMm = shown
    ? Math.min(shown.width / box.width, shown.height / box.height)
    : 1;
  return (
    <svg
      ref={svgRef}
      className={classNames('w-full rounded-md bg-neutral-100', className)}
      viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
      role="img"
      aria-label={`${pageSizeLabel(pageSize)}, ${portrait ? 'portrait' : 'landscape'}`}
    >
      <defs>
        <filter id={shadowId}>
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.25" />
        </filter>
      </defs>
      <rect
        width={view.width}
        height={view.height}
        fill="white"
        filter={`url(#${shadowId})`}
      />
      {ruler !== RULER_OFF && (
        <Rulers variant={ruler} thickness={RULER_WIDTH} pxPerMm={pxPerMm} />
      )}
      <g
        transform={
          portrait ? `translate(${view.width},0) rotate(90)` : undefined
        }
      >
        {padding > 0 && (
          <rect
            x={padding}
            y={padding}
            width={width - padding * 2}
            height={height - padding * 2}
            fill="none"
            stroke="#b8b8b8"
            strokeWidth={0.8}
            strokeDasharray="4 3"
          />
        )}
        {underlay}
        <line
          x1={0}
          y1={0}
          x2={middle.x}
          y2={middle.y}
          stroke="#a3a3a3"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        <circle
          cx={middle.x}
          cy={middle.y}
          r={5}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={1.5}
        />
        <circle cx={middle.x} cy={middle.y} r={1.5} fill="#f59e0b" />
        <g
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline stroke="#f00" points="0,0 20,0 16,-4" />
          <polyline stroke="#0f0" points="0,0 0,20 -4,16" />
          <circle fill="#00f" stroke="none" r={4} />
        </g>
        {children}
      </g>
    </svg>
  );
};

export default PagePreview;
