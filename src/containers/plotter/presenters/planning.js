import { makeAutoObservable } from 'mobx';
import plan from 'plotter/planner';
import { toSvgPathDef } from 'plotter/svg/presentation';

export const PLANNING_PHASE_SETUP = 'axidraw-web-planning-phase-setup';
export const PLANNING_PHASE_PLANNING = 'axidraw-web-planning-phase-planning';
export const PLANNING_PHASE_PLOTTING = 'axidraw-web-planning-phase-plotting';

const createPlanning = () =>
  makeAutoObservable(
    {
      svgContent: null,
      filename: null,
      lines: null,
      motions: null,
      fileInfo: null,
      previewStrokeWidth: 0.4, // mm
      setPreviewStrokeWidth(width) {
        this.previewStrokeWidth = width;
      },
      phase: PLANNING_PHASE_SETUP,
      setPhase(phase) {
        this.phase = phase;
      },
      loadFromUrl(url) {
        fetch(url)
          .then((resp) => resp.text())
          .then((svg) => {
            const filename = url.split('/').pop();
            this.loadSVGContent(filename.split(/\.svg/i)[0], svg);
          });
      },
      loadFromFile(file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.loadSVGContent(file.name, ev.target.result);
        };
        reader.readAsText(file);
      },
      loadSVGContent(filename, content) {
        this.filename = filename.split(/\.svg/i)[0];
        this.svgContent = content;
        this.lines = null;
        this.motions = null;
      },
      updateFileInfo(fileInfo) {
        this.fileInfo = fileInfo;
      },
      updateLines(lines) {
        this.lines = lines;
        this.motions = null;
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
      deep: false,
    },
  );

export default createPlanning;
