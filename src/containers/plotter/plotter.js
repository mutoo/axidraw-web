import React from 'react';
import Workspace from './components/workspace';
import styles from './plotter.css';
import createPageSetup from './presenters/page';
import Preview from './components/preview';

const pageSetup = createPageSetup();

const Plotter = () => {
  return (
    <>
      <main className={styles.workspace}>
        <Workspace margin={20} page={pageSetup} />
      </main>
      <aside className={styles.panel}>
        <Preview page={pageSetup} />
      </aside>
    </>
  );
};

export default Plotter;
