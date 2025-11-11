const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: './src/renderer.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'renderer.bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react', '@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.less$/,
        use: ['style-loader', 'css-loader', 'less-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      // Alias node: modules to regular Node.js modules
      'node:path': 'path',
      'node:fs': 'fs',
      'node:util': 'util',
      'node:stream': 'stream',
      'node:buffer': 'buffer',
      'node:process': 'process',
      'node:url': 'url',
      'node:crypto': 'crypto',
      'node:os': 'os',
      'node:assert': 'assert',
      'node:constants': 'constants',
      'node:events': 'events',
      'node:http': 'http',
      'node:https': 'https',
      'node:net': 'net',
      'node:tls': 'tls',
      'node:zlib': 'zlib',
      // Polyfill global for browser-like environment
      'global': path.resolve(__dirname, 'src/polyfills/global.js')
    },
    fallback: {
      'global': path.resolve(__dirname, 'src/polyfills/global.js')
    }
  },
  plugins: [
    // Replace node: imports with regular Node.js modules before webpack processes them
    new webpack.NormalModuleReplacementPlugin(
      /^node:/,
      (resource) => {
        resource.request = resource.request.replace(/^node:/, '');
      }
    ),
    // Provide process, Buffer, and global for dependencies that need them
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
      global: [path.resolve(__dirname, 'src/polyfills/global.js'), 'default']
    })
  ],
  target: 'electron-renderer',
  devtool: 'source-map',
  // Prevent webpack from externalizing node: modules
  externals: function({ request }, callback) {
    // Don't externalize node: modules - let NormalModuleReplacementPlugin handle them
    if (request && request.startsWith('node:')) {
      return callback();
    }
    callback();
  }
};
