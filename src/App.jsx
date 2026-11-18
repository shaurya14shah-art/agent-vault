import { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import './styles/tokens.css';
import './styles/base.css';

import SmoothScroll from './components/SmoothScroll';
import Cursor from './components/Cursor';
import Nav from './components/Nav';
import Atmosphere from './components/Atmosphere';
import Boot, { bootedAlready } from './components/Boot';

const Portfolio     = lazy(() => import('./pages/Portfolio'));
const AgentCipher   = lazy(() => import('./pages/AgentCipher'));
const AgentEminence = lazy(() => import('./pages/AgentEminence'));
const GameX         = lazy(() => import('./pages/GameX'));

/** Quiet hold while a route chunk arrives — no spinner, no layout jump. */
function Hold() {
  return (
    <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}>
      <span className="t-mono">Retrieving dossier…</span>
    </div>
  );
}

function Shell() {
  const { pathname } = useLocation();
  const [booting, setBooting] = useState(
    () => pathname === '/' && !bootedAlready()
  );

  return (
    <>
      {booting && <Boot onDone={() => setBooting(false)} />}
      <Cursor />
      <Atmosphere />
      <Nav />
      <main>
        <Suspense fallback={<Hold />}>
          <Routes>
            <Route path="/"               element={<Portfolio />} />
            <Route path="/agent-cipher"   element={<AgentCipher />} />
            <Route path="/agent-eminence" element={<AgentEminence />} />
            <Route path="/game-x"         element={<GameX />} />
            <Route path="*"               element={<Portfolio />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SmoothScroll>
        <Shell />
      </SmoothScroll>
    </BrowserRouter>
  );
}
