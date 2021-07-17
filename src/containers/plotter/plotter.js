import React from 'react';
import Workspace from './components/workspace';
import styles from './plotter.css';
import createPageSetup from './presenters/page';
import createWork from './presenters/work';
import Preview from './components/preview';

const pageSetup = createPageSetup();
const work = createWork();

const Plotter = () => {
  return (
    <>
      <main className={styles.workspace}>
        <Workspace page={pageSetup} work={work} />
      </main>
      <aside className={styles.panel}>
        <Preview page={pageSetup} work={work} />
      </aside>
    </>
  );
};

export default Plotter;
