import React, { useContext, useLayoutEffect, useRef, useState } from 'react';
import clean from 'plotter/cleaner';
import { mm2px } from 'math/svg';
import { observer } from 'mobx-react-lite';
import svgToLines from 'plotter/parser/svg-to-lines';
import classNames from 'classnames';
import styles from './preview.css';
import PlotterContext from '../../context';
import { WORK_PHASE_PLANNING, WORK_PHASE_PREVIEW } from '../../presenters/work';

const Preview = observer(({ ...props }) => {
  const { work, page } = useContext(PlotterContext);
  const previewContainerRef = useRef(null);
  const [strokeWidthPercent, setStrokeWidthPercent] = useState(1);
  const paddingPx = mm2px(page.padding);
  const widthPx = mm2px(page.width);
  const heightPx = mm2px(page.height);
  const { contentFitPage, contentPreserveAspectRatio } = page;
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
    page.padding,
    page.orientation,
    page.alignment.vertical,
    page.alignment.horizontal,
    page.contentFitPage,
    work.svgContent,
  ]);
  useLayoutEffect(() => {
    // when switch to planning phase, extract svg to lines.
    if (work.phase === WORK_PHASE_PLANNING) {
      const container = previewContainerRef.current;
      const imported = container?.children[0];
      if (!imported) {
        return;
      }
      work.updateLines(svgToLines(imported));
    }
  }, [work.phase]);
  return (
    <g
      className={classNames(
        styles.root,
        work.phase === WORK_PHASE_PREVIEW ? 'block' : 'hidden',
      )}
      style={{
        '--preview-stroke-width': strokeWidthPercent,
      }}
      dangerouslySetInnerHTML={{ __html: work.svgContent }}
      ref={previewContainerRef}
      {...props}
    />
  );
});

Preview.propTypes = {};

export default Preview;
