// eslint-disable-next-line import/prefer-default-export
export const displayFileInfo = ({ counts }) => {
  const fileInfo = document.getElementById('file-info');
  fileInfo.innerText = JSON.stringify(counts, null, 2);
};
