import { makeAutoObservable, observable } from 'mobx';
import plan from 'plotter/planner';
import { toSvgPathDef } from 'plotter/parser/svg-presentation';

export const PLANNING_PHASE_PREVIEW = 'axidraw-web-planning-phase-preview';
export const PLANNING_PHASE_PLANNING = 'axidraw-web-planning-phase-planning';
export const PLANNING_PHASE_PLOTTING = 'axidraw-web-planning-phase-plotting';

const createPlanning = () =>
  makeAutoObservable(
    {
      svgContent: null,
      // optimize: don't watch the child elements of lines and motions
      lines: observable.shallow([]),
      motions: observable.shallow([]),
      fileInfo: null,
      phase: PLANNING_PHASE_PREVIEW,
      setPhase(phase) {
        this.phase = phase;
      },
      loadFromUrl(url) {
        fetch(url)
          .then((resp) => resp.text())
          .then((svg) => {
            this.loadSVGContent(svg);
          });
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
        this.lines = [];
        this.motions = [];
      },
      updateFileInfo(fileInfo) {
        this.fileInfo = fileInfo;
      },
      updateLines(lines) {
        this.lines = lines;
        this.motions = [];
      },
      planMotion(options) {
        if (!this.lines?.length) {
          throw new Error('Lines are not ready');
        }
        this.motions = plan(this.lines, options);
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

export default createPlanning;
