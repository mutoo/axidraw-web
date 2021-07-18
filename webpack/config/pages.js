import HtmlWebpackPlugin from 'html-webpack-plugin';

export const shareOptions = {
  meta: {
    viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no',
  },
  inject: 'body',
};

// eslint-disable-next-line import/prefer-default-export
export const generatePages = () => ({
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      chunks: ['plotter'],
      template: './src/pages/index.html',
      ...shareOptions,
    }),
    new HtmlWebpackPlugin({
      filename: 'composer.html',
      chunks: ['composer'],
      template: './src/pages/sub.html',
      templateParameters: {
        title: 'Composer',
      },
      ...shareOptions,
    }),
    new HtmlWebpackPlugin({
      filename: 'debugger.html',
      chunks: ['debugger'],
      template: './src/pages/sub.html',
      templateParameters: {
        title: 'Debugger',
      },
      ...shareOptions,
    }),
  ],
});
