import classNames from 'clsx';
import { observer } from 'mobx-react-lite';
import { useContext, useLayoutEffect, useRef } from 'react';
import { mm2px } from '@/math/svg';
import clean from '@/plotter/cleaner';
import svgToLines, { SVGContainer } from '@/plotter/svg/svg-to-lines';
import { PlotterContext } from '../../context';
import { PLANNING_PHASE } from '../../presenters/planning';
import styles from './setup.module.css';

const Setup = observer(({ ...props }) => {
  const { planning, page } = useContext(PlotterContext);
  const setupContainerRef = useRef<SVGGElement>(null);
  const paddingPx = mm2px(page.padding);
  const widthPx = mm2px(page.width);
  const heightPx = mm2px(page.height);
  const { contentFitPage, contentPreserveAspectRatio } = page;
  useLayoutEffect(() => {
    const container = setupContainerRef.current;
    const imported = container?.children[0] as SVGGraphicsElement | null;
    if (!imported) {
      return;
    }
    /* remove unsupported elements */
    if (!imported.hasAttribute('data-cleaned')) {
      const response = clean(imported);
      planning.updateFileInfo(response.counts);
      imported.setAttribute('data-cleaned', ''); // set to true with empty string
    }
    /* adjust svg dimension as per page setup */
    if (!imported.hasAttribute('data-original-viewBox')) {
      const originalViewBox = imported.getAttribute('viewBox');
      if (originalViewBox) {
        imported.setAttribute('data-original-viewBox', originalViewBox);
      }
    }
    imported.setAttribute('width', String(widthPx - paddingPx * 2));
    imported.setAttribute('height', String(heightPx - paddingPx * 2));
    imported.setAttribute('x', String(paddingPx));
    imported.setAttribute('y', String(paddingPx));
    imported.setAttribute('preserveAspectRatio', contentPreserveAspectRatio);
    const originalViewBox = imported.getAttribute('data-original-viewBox');
    const bbox = imported.getBBox();
    imported.setAttribute(
      'viewBox',
      contentFitPage
        ? `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`
        : (originalViewBox ?? ''),
    );
  }, [
    page.size,
    page.padding,
    page.orientation,
    page.alignment.vertical,
    page.alignment.horizontal,
    page.contentFitPage,
    planning.svgContent,
    widthPx,
    paddingPx,
    heightPx,
    contentPreserveAspectRatio,
    contentFitPage,
    planning,
  ]);
  useLayoutEffect(() => {
    // when switch to planning phase, extract svg to lines.
    if (planning.phase === PLANNING_PHASE.PLANNING) {
      const container = setupContainerRef.current;
      const imported = container?.children[0] as SVGContainer | null;
      if (!imported) {
        return;
      }
      planning.updateLines(svgToLines(imported));
    }
  }, [planning, planning.phase]);
  return (
    <g
      ref={setupContainerRef}
      className={classNames(
        styles.root,
        planning.phase === PLANNING_PHASE.SETUP ? 'block' : 'hidden',
      )}
      dangerouslySetInnerHTML={{ __html: planning.svgContent ?? '' }}
      {...props}
    />
  );
});

export default Setup;
