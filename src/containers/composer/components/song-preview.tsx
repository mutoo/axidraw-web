import type { PageSize } from '@/containers/plotter/presenters/page';
import { PAGE_ORIENTATION_PORTRAIT } from '@/containers/plotter/presenters/page';
import type { Placement, Point } from '../stage';
import PagePreview from './page-preview';

const toPoints = (points: Point[]) =>
  points.map(({ x, y }) => `${x},${y}`).join(' ');

/**
 * The song's path alone, scaled up to fill the view, turned as the page is.
 */
const CloseUp = ({
  pageSize,
  orientation,
  placement,
}: {
  pageSize: PageSize;
  orientation: string;
  placement: Placement;
}) => {
  const portrait = orientation === PAGE_ORIENTATION_PORTRAIT;
  const toView = ({ x, y }: Point) =>
    portrait ? { x: pageSize.height - y, y: x } : { x, y };
  const points = placement.path.map(toView);
  const box = points.reduce(
    (b, { x, y }) => ({
      minX: Math.min(b.minX, x),
      maxX: Math.max(b.maxX, x),
      minY: Math.min(b.minY, y),
      maxY: Math.max(b.maxY, y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
  const size = Math.max(box.maxX - box.minX, box.maxY - box.minY, 1);
  const margin = size * 0.08;
  const start = points[0];
  return (
    <svg
      className="h-64 w-full rounded-md border bg-white"
      viewBox={`${box.minX - margin} ${box.minY - margin} ${box.maxX - box.minX + margin * 2} ${box.maxY - box.minY + margin * 2}`}
      role="img"
      aria-label="The pen's path for the song, close up"
    >
      <polyline
        points={toPoints(points)}
        fill="none"
        stroke="#2563eb"
        strokeWidth={1}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={start.x} cy={start.y} r={size / 40} fill="#f59e0b" />
    </svg>
  );
};

/**
 * Everything the pen will do: walk from the origin to the middle, play the
 * song within the area it keeps to, and walk back to the origin. Next to the
 * page, the song's path close up.
 */
const SongPreview = ({
  pageSize,
  orientation,
  padding,
  placement,
}: {
  pageSize: PageSize;
  orientation: string;
  padding: number;
  placement: Placement;
}) => {
  const end = placement.path[placement.path.length - 1];
  return (
    <div className="grid grid-cols-2 gap-4">
      <PagePreview
        className="h-64"
        pageSize={pageSize}
        orientation={orientation}
        padding={padding}
        underlay={
          <>
            <polygon
              points={toPoints(placement.area)}
              fill="#3b82f6"
              fillOpacity={0.08}
            />
            <line
              x1={end.x}
              y1={end.y}
              x2={0}
              y2={0}
              stroke="#a3a3a3"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          </>
        }
      >
        <polyline
          points={toPoints(placement.path)}
          fill="none"
          stroke="#2563eb"
          strokeWidth={1}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </PagePreview>
      <CloseUp
        pageSize={pageSize}
        orientation={orientation}
        placement={placement}
      />
    </div>
  );
};

export default SongPreview;
