import { makeAutoObservable } from 'mobx';
import { px2mm } from '@/math/svg';
import type { PageSize } from '@/plotter/page-sizes';
import { defaultPageSize } from '@/plotter/page-sizes';

export const PAGE_ORIENTATION_LANDSCAPE =
  'axidraw-web-page-orientation-landscape';
export const PAGE_ORIENTATION_PORTRAIT =
  'axidraw-web-page-orientation-portrait';

export const PAGE_ALIGNMENT_VERTICAL_CENTER =
  'axidraw-web-page-alignment-vertical-center';
export const PAGE_ALIGNMENT_VERTICAL_TOP =
  'axidraw-web-page-alignment-vertical-top';
export const PAGE_ALIGNMENT_VERTICAL_BOTTOM =
  'axidraw-web-page-alignment-vertical-bottom';

export const PAGE_ALIGNMENT_HORIZONTAL_CENTER =
  'axidraw-web-page-alignment-horizontal-center';
export const PAGE_ALIGNMENT_HORIZONTAL_START =
  'axidraw-web-page-alignment-horizontal-start';
export const PAGE_ALIGNMENT_HORIZONTAL_END =
  'axidraw-web-page-alignment-horizontal-end';

const createPageSetup = () =>
  makeAutoObservable({
    size: defaultPageSize,
    padding: defaultPageSize.defaultPadding,
    orientation: PAGE_ORIENTATION_LANDSCAPE,
    alignment: {
      vertical: PAGE_ALIGNMENT_VERTICAL_CENTER,
      horizontal: PAGE_ALIGNMENT_HORIZONTAL_CENTER,
    },
    contentFitPage: true,
    get width(): number {
      return this.orientation === PAGE_ORIENTATION_LANDSCAPE
        ? this.size.width
        : this.size.height;
    },
    get height(): number {
      return this.orientation === PAGE_ORIENTATION_LANDSCAPE
        ? this.size.height
        : this.size.width;
    },
    setSize(size: PageSize) {
      this.size = size;
      this.padding = size.defaultPadding;
    },
    setPadding(padding: number) {
      this.padding = padding;
    },
    setOrientation(orientation: string) {
      this.orientation = orientation;
    },
    setAlignmentVertical(alignment: string) {
      this.alignment.vertical = alignment;
    },
    setAlignmentHorizontal(alignment: string) {
      this.alignment.horizontal = alignment;
    },
    setContentFitPage(fit: boolean) {
      this.contentFitPage = fit;
    },
    get contentPreserveAspectRatio(): string {
      const alignmentX =
        {
          [PAGE_ALIGNMENT_HORIZONTAL_START]: 'xMin',
          [PAGE_ALIGNMENT_HORIZONTAL_CENTER]: 'xMid',
          [PAGE_ALIGNMENT_HORIZONTAL_END]: 'xMax',
        }[this.alignment.horizontal] ?? 'xMid';
      const alignmentY =
        {
          [PAGE_ALIGNMENT_VERTICAL_TOP]: 'YMin',
          [PAGE_ALIGNMENT_VERTICAL_CENTER]: 'YMid',
          [PAGE_ALIGNMENT_VERTICAL_BOTTOM]: 'YMax',
        }[this.alignment.vertical] ?? 'YMid';
      return `${alignmentX}${alignmentY} meet`;
    },
    get screenToPageMatrix() {
      const scale = px2mm(1);
      const scaleMatrix = new DOMMatrix();
      scaleMatrix.scaleSelf(scale);
      if (this.orientation === PAGE_ORIENTATION_LANDSCAPE) {
        return scaleMatrix;
      }
      const translateMatrix = new DOMMatrix();
      translateMatrix.translateSelf(-this.size.height, 0);
      const rotateMatrix = new DOMMatrix();
      rotateMatrix.rotateSelf(0, 0, -90);
      return rotateMatrix.multiply(translateMatrix).multiply(scaleMatrix);
    },
    get pageToScreenMatrix(): DOMMatrix {
      return this.screenToPageMatrix.inverse();
    },
  });

export default createPageSetup;
