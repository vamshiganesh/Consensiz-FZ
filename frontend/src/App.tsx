import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Shell } from './components/Shell';
import { Dashboard } from './pages/Dashboard';
import { Contracts } from './pages/Contracts';
import { FuzzTesting } from './pages/FuzzTesting';
import { FailureVault } from './pages/FailureVault';
import { CrossContractVerification } from './pages/CrossContractVerification';
import { Settings } from './pages/Settings';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Contracts />} />
          <Route path="/cross-contract" element={<CrossContractVerification />} />
          <Route path="/runs" element={<FuzzTesting />} />
          <Route path="/vault" element={<FailureVault />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
