import { defineConfig } from '@rspack/cli';
import rspack from '@rspack/core';
import ReactRefreshPlugin from '@rspack/plugin-react-refresh';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  entry: './src/main.tsx',
  mode: isDev ? 'development' : 'production',
  devtool: isDev ? 'eval-source-map' : false,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
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
                parser: { syntax: 'typescript', tsx: true },
                transform: {
                  react: {
                    runtime: 'automatic',
                    development: isDev,
                    refresh: isDev,
                  },
                },
              },
            },
          },
        ],
        type: 'javascript/auto',
      },
      { test: /\.css$/, type: 'css' },
      { test: /\.json$/, type: 'json' },
      { test: /\.(webp|png|jpe?g|svg|gif)$/, type: 'asset/resource' },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './index.html', inject: true }),
    new rspack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
    ...(isDev ? [new ReactRefreshPlugin(), new rspack.ProgressPlugin({})] : []),
  ],
  devServer: {
    port: 1420,
    hot: true,
    host: 'localhost',
    // Tauri ждёт фиксированный порт 1420 (devUrl в tauri.conf.json).
    // src-tauri не входит в граф модулей → не отслеживается devServer'ом.
  },
  experiments: {
    css: true,
  },
});
