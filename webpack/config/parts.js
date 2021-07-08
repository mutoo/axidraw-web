import * as path from 'path';

export const loadJavascript = () => ({
  module: {
    rules: [
      {
        test: /\.jsx?/,
        include: path.resolve(__dirname, '../src'),
        use: 'babel-loader',
      },
    ],
  },
});

export const loadCss = () => ({});
