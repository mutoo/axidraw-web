import { makeAutoObservable, observable } from 'mobx';
import plan from 'plotter/planner';
import { toSvgPathDef } from 'plotter/parser/svg-presentation';

export const WORK_PHASE_PREVIEW = 'axidraw-web-work-phase-preview';
export const WORK_PHASE_PLANNING = 'axidraw-web-work-phase-planning';
export const WORK_PHASE_PLOTTING = 'axidraw-web-work-phase-plotting';

const createWork = () =>
  makeAutoObservable(
    {
      svgContent: null,
      // optimize: don't watch the child elements of lines and motions
      lines: observable.array([], { deep: false }),
      motions: observable.array([], { deep: false }),
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
        this.lines.clear();
        this.motions.clear();
      },
      updateFileInfo(fileInfo) {
        this.fileInfo = fileInfo;
      },
      updateLines(lines) {
        this.lines.replace(lines);
        this.motions.clear();
      },
      planMotion(options) {
        if (!this.lines?.length) {
          throw new Error('Lines are not ready');
        }
        this.motions.replace(plan(this.lines, options));
      },
      get linesAsPathDef() {
        return toSvgPathDef(
          this.motions
            ?.filter((motion) => motion.pen === 0)
            .map((motion) => motion.line),
        );
      },
      get connectionsAsPathDef() {
        return toSvgPathDef(
          this.motions
            ?.filter((motion) => motion.pen === 1)
            .map((motion) => motion.line),
        );
      },
    },
    null,
    {
      name: 'axidraw-web-work',
    },
  );

export default createWork;
