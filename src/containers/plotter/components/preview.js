import React from 'react';
import PropTypes from 'prop-types';
import formStyles from 'components/ui/form.css';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import styles from './preview.css';
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
} from '../presenters/page';

const Preview = observer(({ page }) => {
  return (
    <div className={styles.root}>
      <h3>Preview</h3>
      <p>In this phase, you could load svg and set up the page.</p>
      <div>
        <input type="file" accept="image/svg+xml" style={{ display: 'none' }} />
        <button type="button" id="file-btn">
          Load SVG
        </button>
      </div>
      <p>
        Or simply <b>Drag & Drop</b> your svg into the page area.
      </p>
      <div className={styles.inputs}>
        <h4 className="col-span-2">Dimension</h4>
        <label htmlFor="page-size">PageSize: </label>
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
        <h4 className="col-span-2">File Information:</h4>
        <textarea className="col-span-2">test</textarea>
      </div>
      <div>
        <p>Plan the motion before sending it to the plotter.</p>
        <button type="button" id="go-planning">
          Go
        </button>
      </div>
    </div>
  );
});

Preview.propTypes = {
  page: PropTypes.object,
};

export default Preview;
