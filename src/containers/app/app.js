import React, { lazy, Suspense } from 'react';
import Loading from 'components/loading/loading';

const Debugger = lazy(() => import('containers/debugger/debugger'));

const App = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Debugger />
    </Suspense>
  );
};

export default App;
