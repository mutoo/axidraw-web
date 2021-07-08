import * as path from 'path';

export const loadJavascript = () => ({
  module: {
    rules: [
      {
        test: /\.jsx?/,
        include: path.resolve(__dirname, '../../src'),
        use: {
          loader: 'babel-loader',
          options: {},
        },
      },
    ],
  },
});

export const loadCss = () => ({
  module: {
    rules: [
      {
        test: /\.css$/,
        include: path.resolve(__dirname, '../../src'),
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
          },
        ],
      },
    ],
  },
});
