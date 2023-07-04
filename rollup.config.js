import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';

export default {
  input: {
    index: 'index.js',
    'bin/index': 'bin/index.js'
  },
  output: {
    dir: 'dist',
    format: 'es',
    plugins: [terser()]
  },
  plugins: [
    copy({
      targets: [
        { src: 'assets/*', dest: 'dist/assets' }
      ]
    })
  ]
};
