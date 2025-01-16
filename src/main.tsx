/* eslint-disable react-refresh/only-export-components */
import { lazy, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import '@/utils/logger';
import './index.css';

const Plotter = lazy(() => import('./containers/plotter/plotter'));
const VirtualPlotter = lazy(() => import('./containers/virtual/virtual'));
const Debugger = lazy(() => import('./containers/debugger/debugger'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Plotter />} />
        <Route path="/debugger" element={<Debugger />} />
        <Route path="/virtual" element={<VirtualPlotter />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
