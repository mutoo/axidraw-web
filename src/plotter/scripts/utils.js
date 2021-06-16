// eslint-disable-next-line import/prefer-default-export
export const displayFileInfo = ({ counts }) => {
  const fileInfo = document.getElementById('file-info');
  fileInfo.innerText = JSON.stringify(counts, null, 2);
};

export const activePhase = (phase) => {
  document
    .querySelectorAll('.aw-phase')
    .forEach((el) => el.classList.remove('aw-phase--active'));
  document.querySelector(`#${phase}`).classList.add('aw-phase--active');
};
