import {
  defaultPageSize,
  getPageSize,
  pageSizes,
  updatePage,
} from './paper.js';
import { loadFromFile } from './loader.js';
import { displayFileInfo } from './utils.js';

const { preview } = window;

pageSizes.forEach((pageSize) => {
  const option = document.createElement('option');
  option.value = pageSize.type;
  option.innerText = `${pageSize.type.toUpperCase()} (${pageSize.width}mm x ${
    pageSize.height
  }mm)`;
  preview['page-size'].append(option);
});

preview['page-size'].value = defaultPageSize.type;
preview['page-padding'].value = defaultPageSize.defaultPadding;

preview['page-size'].addEventListener('change', (e) => {
  const pageSize = getPageSize(e.target.value);
  preview['page-padding'].value = pageSize.defaultPadding;
  updatePage();
});
preview['page-padding'].addEventListener('change', updatePage);
preview['page-fit'].addEventListener('change', updatePage);
preview['page-align-h'].addEventListener('change', updatePage);
preview['page-align-v'].addEventListener('change', updatePage);
preview['orientation-landscape'].addEventListener('change', updatePage);
preview['orientation-portrait'].addEventListener('change', updatePage);
preview['file-input'].addEventListener('change', async (e) => {
  const { files } = e.target;
  if (!files.length) return;
  const svg = files[0];
  const loaded = await loadFromFile(svg);
  displayFileInfo(loaded);
});
preview['file-btn'].addEventListener(
  'click',
  () => {
    preview['file-input'].click();
  },
  false,
);