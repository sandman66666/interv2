const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    main: './src/index.ts',
    questions: './src/questions.tsx'
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.json$/,
        type: 'javascript/auto',
        use: ['json-loader']
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/'
  },
  devServer: {
    static: [
      {
        directory: path.join(__dirname, './'),
        publicPath: '/',
      },
      {
        directory: path.join(__dirname, 'src'),
        publicPath: '/src',
      }
    ],
    compress: true,
    port: 8080,
    hot: false,
    liveReload: false,
    devMiddleware: {
      writeToDisk: true,
    }
  },
};