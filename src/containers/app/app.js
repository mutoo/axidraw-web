import React, { lazy, Suspense } from 'react';
import Loading from 'components/loading/loading';

const Debugger = lazy(() => {
  switch (global.module) {
    case 'debugger':
      return import('containers/debugger/debugger');
    case 'composer':
      return import('containers/composer/composer');
    default:
      return import('containers/plotter/plotter');
  }
});

const App = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Debugger />
    </Suspense>
  );
};

export default App;
