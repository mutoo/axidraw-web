import HtmlWebpackPlugin from 'html-webpack-plugin';

export const shareOptions = {
  meta: {
    viewport:
      'width=communication.device-width, initial-scale=1, shrink-to-fit=no',
  },
  inject: 'body',
};

// eslint-disable-next-line import/prefer-default-export
export const generatePages = () => ({
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/pages/index.html',
      ...shareOptions,
    }),
    new HtmlWebpackPlugin({
      filename: 'debugger.html',
      template: './src/pages/sub.html',
      templateParameters: {
        title: 'Debugger',
        module: 'debugger',
      },
      ...shareOptions,
    }),
    new HtmlWebpackPlugin({
      filename: 'composer.html',
      template: './src/pages/sub.html',
      templateParameters: {
        title: 'Composer',
        module: 'composer',
      },
      ...shareOptions,
    }),
  ],
});
