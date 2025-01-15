import { createContext } from 'react';
import svgPlaceholder from '@/assets/svg/axidraw-first.svg';
import createPageSetup from './presenters/page';
import createPlanning from './presenters/planning';
import createWork from './presenters/work';

export const page = createPageSetup();
export const planning = createPlanning();
export const work = createWork();

if (import.meta.env.NODE_ENV === 'development') {
  setTimeout(() => {
    planning.loadFromUrl(svgPlaceholder);
  });
}

export const PlotterContext = createContext({ page, planning, work });
PlotterContext.displayName = 'Plotter Context';
