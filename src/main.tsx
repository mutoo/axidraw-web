import { lazy, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import './index.css';

const Plotter = lazy(() => import('./containers/plotter/plotter'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Plotter />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
