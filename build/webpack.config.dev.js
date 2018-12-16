const HtmlWebpackPlugin = require('html-webpack-plugin')

const path = require('path')

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    example: './example/index.js',
  },
  output: {
    filename: './tmp/[name].js'
  },
  resolve: {
    alias: {
      'component-sandbox': path.resolve(__dirname, '..', 'src')
    }
  },
  devServer: {
    host: '0.0.0.0',
    disableHostCheck: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, '..', 'example', 'index.html')
    })
  ]
}
