import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import scss from 'rollup-plugin-scss';

import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default {
  input: 'src/main.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'esm',
    sourcemap: true,
  },
  watch: {
    include: 'src/**/*',
  },
  plugins: [
    {
      name: 'watch-index',
      buildStart() {
        this.addWatchFile(require.resolve('./src/index.html'));
      },
    },
    {
      name: 'leaflet',
      resolveId(id) {
        if (id !== 'leaflet') {
          return;
        }
        return join(dirname(require.resolve('leaflet')), 'leaflet-src.esm.js');
      },
    },
    nodeResolve(),
    typescript({ sourceMap: true, inlineSourceMap: true, inlineSources: true }),
    scss({ fileName: 'bundle.css', sourceMap: true }),
    copy({
      targets: [
        { src: 'src/index.html', dest: 'dist' },
        { src: 'node_modules/leaflet/dist/images', dest: 'dist' },
      ],
    }),
  ],
};
