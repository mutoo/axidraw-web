import { makeAutoObservable } from 'mobx';
import { px2mm } from 'math/svg';

export const PAGE_SIZE_A4 = 'axidraw-web-page-size-a4';
export const PAGE_SIZE_A5 = 'axidraw-web-page-size-a5';
export const PAGE_SIZE_A6 = 'axidraw-web-page-size-a6';

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

export const pageSizes = [
  {
    type: PAGE_SIZE_A4,
    alias: 'A4 (297mm x 210mm)',
    width: 297,
    height: 210,
    defaultPadding: 15,
  },
  {
    type: PAGE_SIZE_A5,
    alias: 'A5 (210mm x 148mm)',
    width: 210,
    height: 148,
    defaultPadding: 10,
  },
  {
    type: PAGE_SIZE_A6,
    alias: 'A6 (148mm x 105mm)',
    width: 148,
    height: 105,
    defaultPadding: 5,
  },
];

export const defaultPageSize = pageSizes[0];

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
    get width() {
      return this.orientation === PAGE_ORIENTATION_LANDSCAPE
        ? this.size.width
        : this.size.height;
    },
    get height() {
      return this.orientation === PAGE_ORIENTATION_LANDSCAPE
        ? this.size.height
        : this.size.width;
    },
    setSize(size) {
      this.size = size;
      this.padding = size.defaultPadding;
    },
    setPadding(padding) {
      this.padding = padding;
    },
    setOrientation(orientation) {
      this.orientation = orientation;
    },
    setAlignmentVertical(alignment) {
      this.alignment.vertical = alignment;
    },
    setAlignmentHorizontal(alignment) {
      this.alignment.horizontal = alignment;
    },
    setContentFitPage(fit) {
      this.contentFitPage = fit;
    },
    get contentPreserveAspectRatio() {
      const alignmentX = {
        [PAGE_ALIGNMENT_HORIZONTAL_START]: 'xMin',
        [PAGE_ALIGNMENT_HORIZONTAL_CENTER]: 'xMid',
        [PAGE_ALIGNMENT_HORIZONTAL_END]: 'xMax',
      }[this.alignment.horizontal];
      const alignmentY = {
        [PAGE_ALIGNMENT_VERTICAL_TOP]: 'YMin',
        [PAGE_ALIGNMENT_VERTICAL_CENTER]: 'YMid',
        [PAGE_ALIGNMENT_VERTICAL_BOTTOM]: 'YMax',
      }[this.alignment.vertical];
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
    get pageToScreenMatrix() {
      return this.screenToPageMatrix.inverse();
    },
  });

export default createPageSetup;
