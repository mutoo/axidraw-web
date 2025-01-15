import { makeAutoObservable, runInAction } from 'mobx';
import { Line2D } from '@/math/geom';
import plan, { Motion, PlanOptions } from '@/plotter/planner';
import { toSvgPathDef } from '@/plotter/svg/presentation';

export enum PLANNING_PHASE {
  SETUP,
  PLANNING,
  PLOTTING,
}

const createPlanning = () =>
  makeAutoObservable(
    {
      // store loaded raw svg content
      svgContent: null as string | null,
      // store filename
      filename: null as string | null,
      // store detail of loaded svg
      fileInfo: null as Record<string, number> | null,
      // store planned lines
      lines: null as Line2D[] | null,
      // store lines with pen status
      motions: null as Motion[] | null,
      previewStrokeWidth: 0.4, // mm
      setPreviewStrokeWidth(width: number) {
        this.previewStrokeWidth = width;
      },
      phase: PLANNING_PHASE.SETUP,
      setPhase(phase: PLANNING_PHASE) {
        this.phase = phase;
      },
      loadFromUrl(url: string) {
        void fetch(url)
          .then((resp) => resp.text())
          .then((svg: string) => {
            runInAction(() => {
              const filename = url.split('/').pop();
              this.loadSVGContent(filename!.split(/\.svg/i)[0], svg);
            });
          });
      },
      loadFromFile(file: File) {
        const reader = new FileReader();
        reader.onload = (ev: ProgressEvent<FileReader>) => {
          runInAction(() => {
            if (!ev.target) {
              throw new Error('FileReader target is null');
            }
            this.loadSVGContent(file.name, ev.target.result as string);
          });
        };
        reader.readAsText(file);
      },
      loadSVGContent(filename: string, content: string) {
        this.filename = filename.split(/\.svg/i)[0];
        this.svgContent = content;
        this.lines = null;
        this.motions = null;
      },
      updateFileInfo(fileInfo: Record<string, number>) {
        this.fileInfo = fileInfo;
      },
      updateLines(lines: Line2D[]) {
        this.lines = lines;
        this.motions = null;
      },
      planMotion(
        options: Partial<PlanOptions> & Pick<PlanOptions, 'screenToPageMatrix'>,
      ) {
        if (!this.lines?.length) {
          throw new Error('Lines are not ready');
        }
        this.motions = plan(this.lines, options);
      },
      get linesInfo(): { lines: number } {
        return { lines: this.lines?.length ?? 0 };
      },
      get motionsInfo(): { penDown: number; penUp: number } {
        const init = { penDown: 0, penUp: 0 };
        return (
          this.motions?.reduce((info, motion) => {
            info[motion.pen === 0 ? 'penDown' : 'penUp'] += 1;
            return info;
          }, init) ?? init
        );
      },
      get linesAsPathDef() {
        if (!this.motions?.length) return '';
        const penDownMotions = this.motions.filter(
          ({ pen }) => pen === 0,
        ) as (Motion & { pen: 0 })[];
        return toSvgPathDef(penDownMotions.map(({ line }) => line));
      },
      get connections() {
        if (!this.motions) return [];
        const penUpMotions = this.motions.filter(
          ({ pen }) => pen === 1,
        ) as (Motion & { pen: 1 })[];
        return penUpMotions.map((motion) => motion.line);
      },
      get connectionsAsPathDef() {
        return toSvgPathDef(this.connections);
      },
    },
    undefined,
    {
      name: 'axidraw-web-work',
      deep: false,
    },
  );

export default createPlanning;
