// Rollup plugins
import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/main.js',
  dest: 'dist/main.js',
  format: 'iife',
  sourceMap: 'inline',
  plugins: [
    babel({
      exclude: 'node_modules/**',
    }),
  ]
}
