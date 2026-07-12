import { defineConfig } from '@rspack/cli';
import rspack from '@rspack/core';
import ReactRefreshPlugin from '@rspack/plugin-react-refresh';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  entry: './src/index.tsx',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: process.env.NODE_ENV === 'production' ? false : 'eval-source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    publicPath: process.env.NODE_ENV === 'production' ? '/mechs-assistant/' : '/',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@build': path.resolve(__dirname, '.build'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
                transform: {
                  react: {
                    runtime: 'automatic',
                    development: process.env.NODE_ENV !== 'production',
                    refresh: process.env.NODE_ENV !== 'production',
                  },
                },
              },
            },
          },
        ],
        type: 'javascript/auto',
      },
      {
        test: /\.css$/,
        type: 'css',
      },
      {
        test: /\.json$/,
        type: 'json',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: true,
    }),
    new rspack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
    new rspack.CopyRspackPlugin({
      patterns: [
        {
          from: 'data/icons',
          to: 'data/icons',
          noErrorOnMissing: true,
        },
      ],
    }),
    ...(process.env.NODE_ENV !== 'production'
      ? [new ReactRefreshPlugin(), new rspack.ProgressPlugin({})]
      : []),
  ],
  devServer: {
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
    // .build/ содержит merged JSON, генерируемый build-data вне src/.
    // Без явного watch rspack его не отслеживает, и hot-reload не работает
    // после npm run sync:sheets && npm run build:data.
    watchFiles: ['.build/**/*.json'],
  },
  optimization: {
    usedExports: true,
    sideEffects: true,
  },
  experiments: {
    css: true,
  },
});
