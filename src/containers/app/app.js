import React, { Suspense } from 'react';
import Loading from '../../components/loading/loading';

const App = () => {
  return <Suspense fallback={<Loading />}>hello!!!</Suspense>;
};

export default App;
