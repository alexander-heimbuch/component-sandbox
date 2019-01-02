const { resolve } = require('path');

module.exports = {
  mode: 'production',
  entry: {
    index: resolve(__dirname, '..', 'src', 'index.js'),
    utils: resolve(__dirname, '..', 'src', 'utils.js')
  },
  output: {
    path: resolve(__dirname, '..', 'dist'),
    libraryTarget: 'commonjs2',
    filename: '[name].js'
  }
};
