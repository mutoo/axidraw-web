import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router';
import Loading from '@/components/loading/loading';

const Plotter = lazy(() => import('../plotter/plotter'));
const VirtualPlotter = lazy(() => import('../virtual/virtual'));
const Debugger = lazy(() => import('../debugger/debugger'));
const Composer = lazy(() => import('../composer/composer'));

const App = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Plotter />} />
        <Route path="/debugger" element={<Debugger />} />
        <Route path="/virtual" element={<VirtualPlotter />} />
        <Route path="/composer" element={<Composer />} />
      </Routes>
    </Suspense>
  );
};

export default App;
