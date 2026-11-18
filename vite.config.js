import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // three is by far the heaviest dependency and it never changes between
    // content edits. Splitting it out by name keeps it in the browser cache
    // across deploys — and stops the bundler naming an 890 kB vendor chunk
    // after whichever app module happened to pull it in first.
    rollupOptions: {
      output: {
        // Rolldown only accepts the function form. three and its React
        // bindings are kept together — rolldown re-merges them anyway, since
        // drei re-exports three internals, and one honestly-named chunk beats
        // a 2 kB "three" plus an 890 kB "r3f" holding the actual library.
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/three') || id.includes('@react-three')) return 'three';
          if (id.includes('/gsap/') || id.includes('/lenis/')) return 'motion';
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
