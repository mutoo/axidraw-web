import { activePhase } from './utils.js';

const { planning } = window;

planning['go-preview'].addEventListener('click', () => {
  activePhase('phase-preview');
});
