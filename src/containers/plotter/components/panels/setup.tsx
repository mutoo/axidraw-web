import classNames from 'clsx';
import { CircleArrowRight, Info, TriangleAlert } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { ChangeEvent, Fragment, useContext, useRef } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { Button } from '@/components/ui/button';
import formStyles from '@/components/ui/form.module.css';
import { PlotterContext } from '../../context';
import {
  PAGE_ALIGNMENT_HORIZONTAL_START,
  PAGE_ALIGNMENT_HORIZONTAL_CENTER,
  PAGE_ALIGNMENT_HORIZONTAL_END,
  PAGE_ALIGNMENT_VERTICAL_TOP,
  PAGE_ALIGNMENT_VERTICAL_CENTER,
  PAGE_ALIGNMENT_VERTICAL_BOTTOM,
  PAGE_ORIENTATION_LANDSCAPE,
  PAGE_ORIENTATION_PORTRAIT,
  pageSizes,
} from '../../presenters/page';
import { PLANNING_PHASE } from '../../presenters/planning';
import { trackEvent } from '../../utils';
import Panel from './panel';
import styles from './setup.module.css';

const Setup = observer(({ ...props }) => {
  const { planning, page } = useContext(PlotterContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <Panel active={planning.phase === PLANNING_PHASE.SETUP} {...props}>
      <section>
        <h3>Setup</h3>
        <p className="mb-4">
          Please{' '}
          <input
            className="hidden"
            type="file"
            accept="image/svg+xml"
            ref={fileInputRef}
            onChange={(e) => {
              const { files } = e.target;
              if (!files?.length) return;
              planning.loadFromFile(files[0]);
            }}
          />
          <Button
            variant={planning.svgContent ? 'secondary' : 'default'}
            onClick={() => {
              trackEvent('load svg');
              fileInputRef.current?.click();
            }}
          >
            Load SVG
          </Button>{' '}
          and set up the page.
        </p>
        <Alert variant="default">
          <Info className="h-4 w-4" />
          <AlertTitle>Tip</AlertTitle>
          <AlertDescription>
            You may simply <b>Drag & Drop</b> your svg into the page area.
          </AlertDescription>
        </Alert>
      </section>
      <section className={styles.inputs}>
        <h4 className="col-span-2">Dimension</h4>
        <label htmlFor="page-size">Page Size: </label>
        <select
          id="page-size"
          value={page.size.type}
          onChange={(e) => {
            const size = pageSizes.find(
              (pageSize) => pageSize.type === e.target.value,
            );
            if (size) {
              page.setSize(size);
            }
          }}
        >
          {pageSizes.map((pageSize) => (
            <option key={pageSize.type} value={pageSize.type}>
              {pageSize.alias}
            </option>
          ))}
        </select>
        <label htmlFor="page-padding">Padding(mm): </label>
        <input
          id="page-padding"
          type="number"
          min="0"
          value={page.padding}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            page.setPadding(parseInt(e.target.value, 10));
          }}
        />
        <label>Orientation:</label>
        <div className="inline-flex items-center">
          <label className={classNames(formStyles.radioLabel, 'mr-2')}>
            <input
              type="radio"
              name="orientation"
              value={PAGE_ORIENTATION_LANDSCAPE}
              checked={page.orientation === PAGE_ORIENTATION_LANDSCAPE}
              onChange={() => {
                page.setOrientation(PAGE_ORIENTATION_LANDSCAPE);
              }}
            />
            <span>Landscape</span>
          </label>
          <label className={formStyles.radioLabel}>
            <input
              type="radio"
              name="orientation"
              value={PAGE_ORIENTATION_PORTRAIT}
              checked={page.orientation === PAGE_ORIENTATION_PORTRAIT}
              onChange={() => {
                page.setOrientation(PAGE_ORIENTATION_PORTRAIT);
              }}
            />
            <span>Portrait</span>
          </label>
        </div>
        <label
          className={classNames(formStyles.checkboxLabel, 'col-start-2')}
          htmlFor="page-fit"
        >
          <input
            type="checkbox"
            id="page-fit"
            checked={page.contentFitPage}
            onChange={(e) => {
              page.setContentFitPage(e.target.checked);
            }}
          />
          <span>Fit content to page</span>
        </label>
        <h4 className="col-span-2">Alignment</h4>
        <label htmlFor="page-align-h">Horizontal:</label>
        <select
          id="page-align-h"
          value={page.alignment.horizontal}
          onChange={(e) => {
            page.setAlignmentHorizontal(e.target.value);
          }}
        >
          <option value={PAGE_ALIGNMENT_HORIZONTAL_START}>Left</option>
          <option value={PAGE_ALIGNMENT_HORIZONTAL_CENTER}>Center</option>
          <option value={PAGE_ALIGNMENT_HORIZONTAL_END}>Right</option>
        </select>

        <label className="aw-label" htmlFor="page-align-v">
          Vertical:
        </label>
        <select
          id="page-align-v"
          value={page.alignment.vertical}
          onChange={(e) => {
            page.setAlignmentVertical(e.target.value);
          }}
        >
          <option value={PAGE_ALIGNMENT_VERTICAL_TOP}>Top</option>
          <option value={PAGE_ALIGNMENT_VERTICAL_CENTER}>Center</option>
          <option value={PAGE_ALIGNMENT_VERTICAL_BOTTOM}>Bottom</option>
        </select>
      </section>
      <section className="grid grid-cols-1 gap-4">
        {planning.svgContent ? (
          <Alert variant="default">
            <CircleArrowRight className="h-4 w-4" />
            <AlertTitle>Planning</AlertTitle>
            <AlertDescription>
              Plan the motion before sending it to the plotter.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Blocked</AlertTitle>
            <AlertDescription>Please load a SVG first.</AlertDescription>
          </Alert>
        )}
        <Button
          variant={planning.svgContent ? 'default' : 'secondary'}
          disabled={!planning.svgContent}
          onClick={() => {
            planning.setPhase(PLANNING_PHASE.PLANNING);
            trackEvent('go to', PLANNING_PHASE[PLANNING_PHASE.PLANNING]);
          }}
        >
          <span className="inline-block w-32">Next</span>
        </Button>
        {planning.fileInfo && (
          <>
            <h4>Svg Info:</h4>
            <dl className="grid grid-cols-2 gap-4">
              {Object.entries(planning.fileInfo).map((info) => (
                <Fragment key={info[0]}>
                  <dt>{info[0]}</dt>
                  <dd>{info[1]}</dd>
                </Fragment>
              ))}
            </dl>
          </>
        )}
      </section>
    </Panel>
  );
});

Setup.propTypes = {};

export default Setup;
