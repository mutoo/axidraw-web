/* global SVG */
import { activePhase } from '../utils.js';

const { planning } = window;

planning['go-preview'].addEventListener('click', () => {
  activePhase('phase-preview');
  const imported = SVG('#imported');
  imported.show();
  const planner = SVG('#planner');
  planner.hide();
});
