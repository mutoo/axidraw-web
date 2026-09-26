import Footer from '@/components/footer/footer';
import PageSwitcher from '@/components/page-switcher/page-switcher';
import Planning from './components/panels/planning';
import Plotting from './components/panels/plotting';
import Setup from './components/panels/setup';
import Workspace from './components/workspace/workspace';
import styles from './plotter.module.css';

const Plotter = () => {
  return (
    <>
      <main className={styles.workspace}>
        <Workspace />
        <Footer />
      </main>
      <aside className={styles.panel}>
        <header className={styles.header}>
          <PageSwitcher />
        </header>
        <div className={styles.panels}>
          <Setup />
          <Planning />
          <Plotting />
        </div>
      </aside>
    </>
  );
};

export default Plotter;
