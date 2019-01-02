const HtmlWebpackPlugin = require('html-webpack-plugin');
const { resolve } = require('path');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    example: resolve(__dirname, '..', 'example', 'index.js')
  },
  output: {
    filename: '[name].js',
    path: resolve(__dirname, '..', 'tmp')
  },
  resolve: {
    alias: {
      'component-sandbox': resolve(__dirname, '..', 'src')
    }
  },
  devServer: {
    host: '0.0.0.0',
    disableHostCheck: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: resolve(__dirname, '..', 'example', 'index.html')
    })
  ]
};
