import classNames from 'clsx';
import type { ReactNode } from 'react';
import { useId } from 'react';
import type { PageSize } from '@/containers/plotter/presenters/page';
import { PAGE_ORIENTATION_PORTRAIT } from '@/containers/plotter/presenters/page';

// the desk around the page, in mm
const DESK = 15;

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
  const portrait = orientation === PAGE_ORIENTATION_PORTRAIT;
  // along the plotter's x and y
  const { width, height } = pageSize;
  const view = portrait ? { width: height, height: width } : { width, height };
  const middle = { x: width / 2, y: height / 2 };
  return (
    <svg
      className={classNames('w-full rounded-md bg-neutral-100', className)}
      viewBox={`${-DESK} ${-DESK} ${view.width + DESK * 2} ${view.height + DESK * 2}`}
      role="img"
      aria-label={`${pageSize.alias}, ${portrait ? 'portrait' : 'landscape'}`}
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
