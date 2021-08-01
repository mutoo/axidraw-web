import React, { useContext, useRef } from 'react';
import formStyles from 'components/ui/form.css';
import Button from 'components/ui/button/button';
import Alert from 'components/ui/alert/alert';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
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
import {
  PLANNING_PHASE_PLANNING,
  PLANNING_PHASE_SETUP,
} from '../../presenters/planning';
import PlotterContext from '../../context';
import Panel from './panel';
import styles from './setup.css';
import { trackEvent } from '../../utils';

const Setup = observer(({ ...props }) => {
  const { planning, page } = useContext(PlotterContext);
  const fileInputRef = useRef(null);
  return (
    <Panel active={planning.phase === PLANNING_PHASE_SETUP} {...props}>
      <section>
        <h3>Setup</h3>
        <p>
          In this phase, you could{' '}
          <input
            className="hidden"
            type="file"
            accept="image/svg+xml"
            ref={fileInputRef}
            onChange={async (e) => {
              const { files } = e.target;
              if (!files.length) return;
              planning.loadFromFile(files[0]);
            }}
          />
          <Button
            variant={planning.svgContent ? 'secondary' : 'primary'}
            onClick={() => {
              trackEvent('load svg');
              fileInputRef.current?.click();
            }}
          >
            Load SVG
          </Button>{' '}
          and set up the page. Or simply <b>Drag & Drop</b> your svg into the
          page area.
        </p>
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
          onChange={(e) => page.setPadding(e.target.value)}
        />
        <label>Orientation:</label>
        <div className="inline-flex items-center">
          <label className={classNames(formStyles.radioLabel, 'mr-2')}>
            <input
              type="radio"
              name="orientation"
              value={PAGE_ORIENTATION_LANDSCAPE}
              checked={page.orientation === PAGE_ORIENTATION_LANDSCAPE}
              onChange={() => page.setOrientation(PAGE_ORIENTATION_LANDSCAPE)}
            />
            <span>Landscape</span>
          </label>
          <label className={formStyles.radioLabel}>
            <input
              type="radio"
              name="orientation"
              value={PAGE_ORIENTATION_PORTRAIT}
              checked={page.orientation === PAGE_ORIENTATION_PORTRAIT}
              onChange={() => page.setOrientation(PAGE_ORIENTATION_PORTRAIT)}
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
          onChange={(e) => page.setAlignmentHorizontal(e.target.value)}
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
          onChange={(e) => page.setAlignmentVertical(e.target.value)}
        >
          <option value={PAGE_ALIGNMENT_VERTICAL_TOP}>Top</option>
          <option value={PAGE_ALIGNMENT_VERTICAL_CENTER}>Center</option>
          <option value={PAGE_ALIGNMENT_VERTICAL_BOTTOM}>Bottom</option>
        </select>
      </section>
      <section className="grid grid-cols-1 gap-4">
        {planning.svgContent ? (
          <Alert type="info">
            Plan the motion before sending it to the plotter.
          </Alert>
        ) : (
          <Alert type="warn">Load SVG first.</Alert>
        )}
        <Button
          variant={planning.svgContent ? 'primary' : 'secondary'}
          disabled={!planning.svgContent}
          onClick={() => {
            planning.setPhase(PLANNING_PHASE_PLANNING);
            trackEvent('go to', PLANNING_PHASE_PLANNING);
          }}
        >
          <span className="inline-block w-32">Next</span>
        </Button>
        {planning.fileInfo && (
          <>
            <h4>Svg Info:</h4>
            <dl className="grid grid-cols-2 gap-4">
              {planning.fileInfo.map((info) => (
                <>
                  <dt>{info[0]}</dt>
                  <dd>{info[1]}</dd>
                </>
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
