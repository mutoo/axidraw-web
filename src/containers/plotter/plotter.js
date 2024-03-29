import React from 'react';
import svgPlaceholder from 'assets/svg/axidraw-first.svg';
import Workspace from './components/workspace/workspace';
import styles from './plotter.css';
import createPageSetup from './presenters/page';
import createPlanning from './presenters/planning';
import createWork from './presenters/work';
import Setup from './components/panels/setup';
import Planning from './components/panels/planning';
import Plotting from './components/panels/plotting';
import PlotterContext from './context';
import Footer from '../../components/footer/footer';

// eslint-disable-next-line import/no-unresolved

const page = createPageSetup();
const planning = createPlanning();
const work = createWork();

if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    planning.loadFromUrl(svgPlaceholder);
  });
}

const Plotter = () => {
  return (
    <PlotterContext.Provider value={{ planning, page, work }}>
      <main className={styles.workspace}>
        <Workspace />
        <Footer />
      </main>
      <aside className={styles.panel}>
        <Setup />
        <Planning />
        <Plotting />
      </aside>
    </PlotterContext.Provider>
  );
};

export default Plotter;
