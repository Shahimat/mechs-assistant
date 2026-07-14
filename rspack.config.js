import { defineConfig } from '@rspack/cli';
import rspack from '@rspack/core';
import ReactRefreshPlugin from '@rspack/plugin-react-refresh';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Подхватываем переменные из .env.local. Часть из них — server-only
// (GSHEETS_SA_KEY_PATH и т.п.), используются только в scripts/. Часть
// намеренно инжектируется в клиентский бандл через DefinePlugin ниже
// (MECHS_OVERLAY_SPREADSHEET_ID — не секрет: доступ к таблице
// контролируется Sheets sharing, ID виден в клиенте только тем, кто
// открыл сайт).
dotenvConfig({ path: path.resolve(__dirname, '.env.local') });

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
      '@raw': path.resolve(__dirname, 'assets/raw'),
      '@img': path.resolve(__dirname, 'assets/images'),
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
      {
        test: /\.(webp|png|jpe?g|svg|gif)$/,
        type: 'asset/resource',
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
      'process.env.MECHS_OVERLAY_SPREADSHEET_ID': JSON.stringify(
        process.env.MECHS_OVERLAY_SPREADSHEET_ID || ''
      ),
    }),
    new rspack.CopyRspackPlugin({
      patterns: [
        {
          from: 'data/icons',
          to: 'data/icons',
          noErrorOnMissing: true,
        },
        {
          from: 'public/favicon',
          to: 'favicon',
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
