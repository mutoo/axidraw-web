/* eslint-disable no-unused-vars */
import React, { useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react-lite';
import { mm2px } from 'math/svg';
import clean from 'plotter/cleaner';
import Page from './page';
import styles from './workspace.css';
import ShadowDef from './shadow-def';

const Workspace = observer(({ page, work, margin = 20 }) => {
  const marginPx = mm2px(margin);
  const paddingPx = mm2px(page.padding);
  const widthPx = mm2px(page.width);
  const heightPx = mm2px(page.height);
  const { contentFitPage, contentPreserveAspectRatio } = page;
  const viewBox = `${-marginPx} ${-marginPx} ${widthPx + marginPx * 2} ${
    heightPx + marginPx * 2
  }`;
  const previewContainerRef = useRef(null);
  const [strokeWidthPercent, setStrokeWidthPercent] = useState(1);
  useLayoutEffect(() => {
    const container = previewContainerRef.current;
    const imported = container?.children[0];
    if (!imported) {
      return;
    }
    /* remove unsupported elements */
    if (!imported.hasAttribute('data-cleaned')) {
      const response = clean(imported);
      work.updateFileInfo(response.counts);
      imported.setAttribute('data-cleaned', true);
    }
    /* adjust svg dimension as per page setup */
    if (!imported.hasAttribute('data-original-viewBox')) {
      const originalViewBox = imported.getAttribute('viewBox');
      imported.setAttribute('data-original-viewBox', originalViewBox);
    }
    imported.setAttribute('width', widthPx - paddingPx * 2);
    imported.setAttribute('height', heightPx - paddingPx * 2);
    imported.setAttribute('x', paddingPx);
    imported.setAttribute('y', paddingPx);
    imported.setAttribute('preserveAspectRatio', contentPreserveAspectRatio);
    const originalViewBox = imported.getAttribute('data-original-viewBox');
    const bbox = imported.getBBox();
    imported.setAttribute(
      'viewBox',
      contentFitPage
        ? `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`
        : originalViewBox,
    );
    /* update stroke width */
    const viewWidth = imported.viewBox.baseVal.width;
    const viewHeight = imported.viewBox.baseVal.height;
    const rateX = (0.4 / page.width) * viewWidth;
    const rateY = (0.4 / page.height) * viewHeight;
    setStrokeWidthPercent(Math.max(rateX, rateY));
  }, [
    page.size,
    page.contentFitPage,
    page.alignment.vertical,
    page.alignment.horizontal,
    page.orientation,
    work.svgContent,
  ]);
  return (
    <svg
      className={styles.root}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      version="1.1"
    >
      <defs>
        <ShadowDef margin={margin} />
      </defs>
      <Page page={page} />
      <g
        className={styles.preview}
        style={{
          '--preview-stroke-width': strokeWidthPercent,
        }}
        dangerouslySetInnerHTML={{ __html: work.svgContent }}
        ref={previewContainerRef}
      />
    </svg>
  );
});

Workspace.propTypes = {
  margin: PropTypes.number,
  page: PropTypes.object,
};

export default Workspace;
