import { Info, TriangleAlert } from 'lucide-react';
import PageSizeSelect from '@/components/page-size-select/page-size-select';
import RulerSelect from '@/components/ruler/ruler-select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import formStyles from '@/components/ui/form.module.css';
import {
  PAGE_ORIENTATION_LANDSCAPE,
  PAGE_ORIENTATION_PORTRAIT,
} from '@/containers/plotter/presenters/page';
import type { PageSize } from '@/plotter/page-sizes';
import { checkPadding, maxPadding } from '../stage';
import PagePreview from './page-preview';

const PageSetup = ({
  pageSize,
  orientation,
  padding,
  onPageSizeChange,
  onOrientationChange,
  onPaddingChange,
  onNext,
}: {
  pageSize: PageSize;
  orientation: string;
  padding: number;
  onPageSizeChange: (pageSize: PageSize) => void;
  onOrientationChange: (orientation: string) => void;
  onPaddingChange: (padding: number) => void;
  onNext: () => void;
}) => {
  const paddingProblem = checkPadding(pageSize, padding);
  return (
    <section className={formStyles.root}>
      <h3>Setup</h3>
      <p>
        Set up the page on the plotter. The pen starts at the origin, moves to
        the middle of the page to play, and comes back to the origin when the
        song ends.
      </p>
      <div className="grid grid-cols-2 gap-6">
        <label className={formStyles.inputLabel}>
          <span>Page Size:</span>
          <PageSizeSelect value={pageSize.id} onChange={onPageSizeChange} />
        </label>
        <label className={formStyles.inputLabel}>
          <span>Padding (mm):</span>
          <input
            type="number"
            min={0}
            max={maxPadding(pageSize)}
            value={padding}
            onChange={(e) => {
              onPaddingChange(parseInt(e.target.value, 10));
            }}
          />
        </label>
      </div>
      <div className="flex items-center gap-4">
        <span>Orientation:</span>
        <label className={formStyles.radioLabel}>
          <input
            type="radio"
            name="composer-orientation"
            value={PAGE_ORIENTATION_LANDSCAPE}
            checked={orientation === PAGE_ORIENTATION_LANDSCAPE}
            onChange={() => {
              onOrientationChange(PAGE_ORIENTATION_LANDSCAPE);
            }}
          />
          <span>Landscape</span>
        </label>
        <label className={formStyles.radioLabel}>
          <input
            type="radio"
            name="composer-orientation"
            value={PAGE_ORIENTATION_PORTRAIT}
            checked={orientation === PAGE_ORIENTATION_PORTRAIT}
            onChange={() => {
              onOrientationChange(PAGE_ORIENTATION_PORTRAIT);
            }}
          />
          <span>Portrait</span>
        </label>
        <label className="ml-auto flex items-center gap-2">
          <span>Ruler:</span>
          <RulerSelect className="py-1" />
        </label>
      </div>
      <PagePreview
        className="h-64"
        pageSize={pageSize}
        orientation={orientation}
        padding={paddingProblem ? 0 : padding}
      />
      {paddingProblem && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Padding</AlertTitle>
          <AlertDescription>{paddingProblem}</AlertDescription>
        </Alert>
      )}
      <Alert variant="default">
        <Info className="h-4 w-4" />
        <AlertTitle>Before playing</AlertTitle>
        <AlertDescription>
          <p>
            Put the pen at the origin{' '}
            <span className="inline-block size-2 rounded-full bg-[#00f]" /> and
            line the page up with it, as for plotting. The song is played from
            the middle{' '}
            <span className="inline-block size-2 rounded-full bg-amber-500" />{' '}
            and the pen keeps inside the padding.
          </p>
        </AlertDescription>
      </Alert>
      <Button
        variant="default"
        disabled={paddingProblem !== null}
        onClick={onNext}
      >
        Next
      </Button>
    </section>
  );
};

export default PageSetup;
