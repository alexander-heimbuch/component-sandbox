// Rollup plugins
import { resolve } from 'path'
import babel from 'rollup-plugin-babel'
import alias from 'rollup-plugin-alias'
import copy from 'rollup-plugin-cpy'
import serve from 'rollup-plugin-serve'
import raw from 'rollup-plugin-string'

export default {
  input: 'example/index.js',
  output: {
    file: 'dist/index.js',
    format: 'iife',
    sourceMap: 'inline'
  },
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),
    alias({
      'component-sandbox': resolve(__dirname, 'src', 'main.js')
    }),
    copy({
      files: 'example/**/*.html',
      dest: 'dist'
    }),
    serve('dist'),
    raw({
      include: ['node_modules/iframe-resizer/js/iframeResizer.contentWindow.min.js'],
    })
  ],
  watch: {
    inculde: ['src/**', 'example/**'],
    exclude: ['node_modules/**']
  }
}
