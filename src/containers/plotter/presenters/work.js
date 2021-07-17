import { makeAutoObservable } from 'mobx';
import { mm2px } from 'math/svg';
import svgToLines from 'plotter/parser/svg-to-lines';
import plan from 'plotter/planner';
import { PAGE_ORIENTATION_LANDSCAPE } from './page';

const createWork = () =>
  makeAutoObservable({
    svgContent: null,
    lines: null,
    motions: null,
    fileInfo: null,
    loadFromFile(file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.svgContent = ev.target.result;
      };
      reader.readAsText(file);
    },
    updateFileInfo(info) {
      this.fileInfo = info;
    },
    parseSVG(svgEl) {
      this.lines = svgToLines(svgEl);
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
