import React, { useContext, useLayoutEffect, useRef } from 'react';
import clean from 'plotter/cleaner';
import { mm2px } from 'math/svg';
import { observer } from 'mobx-react-lite';
import svgToLines from 'plotter/svg/svg-to-lines';
import classNames from 'classnames';
import styles from './setup.css';
import PlotterContext from '../../context';
import {
  PLANNING_PHASE_PLANNING,
  PLANNING_PHASE_SETUP,
} from '../../presenters/planning';

const Setup = observer(({ ...props }) => {
  const { planning, page } = useContext(PlotterContext);
  const setupContainerRef = useRef(null);
  const paddingPx = mm2px(page.padding);
  const widthPx = mm2px(page.width);
  const heightPx = mm2px(page.height);
  const { contentFitPage, contentPreserveAspectRatio } = page;
  useLayoutEffect(() => {
    const container = setupContainerRef.current;
    const imported = container?.children[0];
    if (!imported) {
      return;
    }
    /* remove unsupported elements */
    if (!imported.hasAttribute('data-cleaned')) {
      const response = clean(imported);
      planning.updateFileInfo(response.counts);
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
  }, [
    page.size,
    page.padding,
    page.orientation,
    page.alignment.vertical,
    page.alignment.horizontal,
    page.contentFitPage,
    planning.svgContent,
  ]);
  useLayoutEffect(() => {
    // when switch to planning phase, extract svg to lines.
    if (planning.phase === PLANNING_PHASE_PLANNING) {
      const container = setupContainerRef.current;
      const imported = container?.children[0];
      if (!imported) {
        return;
      }
      planning.updateLines(svgToLines(imported));
    }
  }, [planning.phase]);
  return (
    <g
      className={classNames(
        styles.root,
        planning.phase === PLANNING_PHASE_SETUP ? 'block' : 'hidden',
      )}
      dangerouslySetInnerHTML={{ __html: planning.svgContent }}
      ref={setupContainerRef}
      {...props}
    />
  );
});

Setup.propTypes = {};

export default Setup;
