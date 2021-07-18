import React from 'react';
import Workspace from './components/workspace/workspace';
import styles from './plotter.css';
import createPageSetup from './presenters/page';
import createWork from './presenters/work';
import Preview from './components/panels/preview';
import PlotterContext from './context';

const page = createPageSetup();
const work = createWork();

const Plotter = () => {
  return (
    <PlotterContext.Provider value={{ work, page }}>
      <main className={styles.workspace}>
        <Workspace />
      </main>
      <aside className={styles.panel}>
        <Preview />
      </aside>
    </PlotterContext.Provider>
  );
};

export default Plotter;
