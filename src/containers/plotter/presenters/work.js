import { makeAutoObservable } from 'mobx';
import { mm2px } from 'math/svg';
import plan from 'plotter/planner';
import { toSvgPathDef } from 'plotter/parser/svg-presentation';
import { PAGE_ORIENTATION_LANDSCAPE } from './page';

export const WORK_PHASE_PREVIEW = 'axidraw-web-work-phase-preview';
export const WORK_PHASE_PLANNING = 'axidraw-web-work-phase-planning';
export const WORK_PHASE_PLOTTING = 'axidraw-web-work-phase-plotting';

const createWork = () =>
  makeAutoObservable(
    {
      svgContent: null,
      lines: null,
      motions: null,
      fileInfo: null,
      phase: WORK_PHASE_PREVIEW,
      setPhase(phase) {
        this.phase = phase;
      },
      loadFromFile(file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.loadSVGContent(ev.target.result);
        };
        reader.readAsText(file);
      },
      loadSVGContent(content) {
        this.svgContent = content;
        this.lines = null;
        this.motions = null;
      },
      updateFileInfo(fileInfo) {
        this.fileInfo = fileInfo;
      },
      updateLines(lines) {
        this.lines = lines;
      },
      get linesAsPathDef() {
        return toSvgPathDef(this.lines);
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
      get connectionsAsPathDef() {
        return toSvgPathDef(
          this.motions?.filter((motion) => motion.penStatus === 1),
        );
      },
    },
    {},
    {
      name: 'axidraw-web-work',
      // optimize: don't watch the child elements of lines and motions
      deep: false,
    },
  );

export default createWork;
