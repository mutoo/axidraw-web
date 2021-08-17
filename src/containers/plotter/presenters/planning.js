import { makeAutoObservable, runInAction } from 'mobx';
import plan from 'plotter/planner';
import { toSvgPathDef } from 'plotter/svg/presentation';
import { createRTree } from 'plotter/rtree';
import { pointAsMbr } from 'plotter/rtree/utils';

export const PLANNING_PHASE_SETUP = 'axidraw-web-planning-phase-setup';
export const PLANNING_PHASE_PLANNING = 'axidraw-web-planning-phase-planning';
export const PLANNING_PHASE_PLOTTING = 'axidraw-web-planning-phase-plotting';

const createPlanning = () =>
  makeAutoObservable(
    {
      // store loaded raw svg content
      svgContent: null,
      // store filename
      filename: null,
      // store detail of loaded svg
      fileInfo: null,
      // store planned lines
      lines: null,
      // store lines with pen status
      motions: null,
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
            runInAction(() => {
              const filename = url.split('/').pop();
              this.loadSVGContent(filename.split(/\.svg/i)[0], svg);
            });
          });
      },
      loadFromFile(file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          runInAction(() => {
            this.loadSVGContent(file.name, ev.target.result);
          });
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
      get linesInfo() {
        return { lines: this.lines?.length || 0 };
      },
      get motionsInfo() {
        const init = { penDown: 0, penUp: 0 };
        return (
          this.motions?.reduce((info, motion) => {
            // eslint-disable-next-line no-param-reassign
            info[motion.pen === 0 ? 'penDown' : 'penUp'] += 1;
            return info;
          }, init) || init
        );
      },
      get linesAsPathDef() {
        return toSvgPathDef(
          this.motions
            ?.filter((motion) => motion.pen === 0)
            .map((motion) => motion.line),
        );
      },
      get connections() {
        return (
          this.motions
            ?.filter((motion) => motion.pen === 1)
            .map((motion) => motion.line) || []
        );
      },
      get connectionsAsPathDef() {
        return toSvgPathDef(this.connections);
      },
      get rtree() {
        const rtree = createRTree(2, 4);
        this.connections.forEach((line, idx) => {
          rtree.insert({ id: idx * 2, mbr: pointAsMbr([line[0], line[1]]) });
          rtree.insert({
            id: idx * 2 + 1,
            mbr: pointAsMbr([line[2], line[3]]),
          });
        });
        this.forceRefresh = 0;
        return rtree;
      },
      forceRefresh: 0,
      removePoint() {
        const idx = this.forceRefresh;
        const line = this.connections[idx];
        if (!line) return;
        const entryToRemove0 = {
          id: idx * 2,
          mbr: pointAsMbr([line[0], line[1]]),
        };
        this.rtree.remove(entryToRemove0);
        const entryToRemove1 = {
          id: idx * 2 + 1,
          mbr: pointAsMbr([line[2], line[3]]),
        };
        this.rtree.remove(entryToRemove1);
        this.forceRefresh += 1;
      },
    },
    null,
    {
      name: 'axidraw-web-work',
      deep: false,
    },
  );

export default createPlanning;
