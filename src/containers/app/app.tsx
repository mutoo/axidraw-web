import React, { Suspense } from 'react';
import Loading from '@/components/loading/loading';

const App = ({ children }: { children: React.ReactNode }) => {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
};

export default App;
