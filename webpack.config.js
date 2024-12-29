const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');

// Load environment variables
const env = dotenv.config().parsed || {};
const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {});

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
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
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
  plugins: [
    new webpack.DefinePlugin(envKeys)
  ],
  devServer: {
    static: {
      directory: path.join(__dirname),
      publicPath: '/'
    },
    compress: true,
    port: 8080,
    hot: false,
    liveReload: false,
    historyApiFallback: true,
    devMiddleware: {
      writeToDisk: true,
    },
    proxy: [
      {
        context: [
          '/save-questions',
          '/load-questions',
          '/fs/read',
          '/fs/write',
          '/upload',
          '/recordings',
          '/uploads'
        ],
        target: 'http://localhost:3000',
        secure: false
      }
    ]
  },
};