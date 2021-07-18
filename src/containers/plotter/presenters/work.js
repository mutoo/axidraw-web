import { makeAutoObservable } from 'mobx';
import { mm2px } from 'math/svg';
import plan from 'plotter/planner';
import { PAGE_ORIENTATION_LANDSCAPE } from './page';

export const WORK_PHASE_PREVIEW = 'axidraw-web-work-phase-preview';
export const WORK_PHASE_PLANNING = 'axidraw-web-work-phase-planning';
export const WORK_PHASE_PLOTTING = 'axidraw-web-work-phase-plotting';

const createWork = () =>
  makeAutoObservable({
    svgContent: null,
    lines: null,
    motions: null,
    fileInfo: null,
    phase: WORK_PHASE_PREVIEW,
    loadFromFile(file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.svgContent = ev.target.result;
      };
      reader.readAsText(file);
    },
    planMotion({ page }) {
      if (!this.lines?.length) {
        throw new Error('Lines are not ready');
      }
      this.motions = plan(this.lines, {
        screenToPageMatrix: page.screenToPageMatrix,
        origin:
          page.orientation === PAGE_ORIENTATION_LANDSCAPE
            ? [0, 0]
            : [mm2px(page.size.height), 0],
      });
    },
  });

export default createWork;
