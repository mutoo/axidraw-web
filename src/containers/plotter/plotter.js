import React from 'react';
import Workspace from './components/workspace/workspace';
import styles from './plotter.css';
import createPageSetup from './presenters/page';
import createPlanning from './presenters/planning';
import Preview from './components/panels/preview';
import Planning from './components/panels/planning';
import PlotterContext from './context';

const page = createPageSetup();
const planning = createPlanning();

const Plotter = () => {
  return (
    <PlotterContext.Provider value={{ planning, page }}>
      <main className={styles.workspace}>
        <Workspace />
      </main>
      <aside className={styles.panel}>
        <Preview />
        <Planning />
      </aside>
    </PlotterContext.Provider>
  );
};

export default Plotter;
