const { resolve } = require('path')

module.exports = {
  mode: 'production',
  entry: {
    index: './src/index.js',
    utils: './src/utils.js'
  },
  output: {
    path: resolve('./dist'),
    filename: '[name].js'
  }
}
