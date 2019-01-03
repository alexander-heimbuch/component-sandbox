const HtmlWebpackPlugin = require('html-webpack-plugin');
const { resolve } = require('path');
const srcDir = resolve(__dirname, '..', 'src');
const inlineSources = [resolve(srcDir, 'inline-scripts.js'), resolve(srcDir, 'inline-utils.js')];

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
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/, ...inlineSources],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  useBuiltIns: 'usage'
                }
              ]
            ]
          }
        }
      },
      {
        test: inlineSources,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
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
