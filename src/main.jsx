import { createRoot } from 'react-dom/client';
import App from './App.jsx';

/**
 * No StrictMode.
 *
 * Its double-mount tears down and rebuilds the WebGL context for every route
 * that owns a Canvas, which costs a context loss per navigation and hides
 * real rendering problems behind a fake one. The 3D lifecycles in src/three
 * clean up explicitly instead.
 */
createRoot(document.getElementById('root')).render(<App />);
