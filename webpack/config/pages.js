import HtmlWebpackPlugin from 'html-webpack-plugin';

export const shareOptions = {
  meta: { viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no' },
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
      template: './src/pages/debugger.html',
      ...shareOptions,
    }),
  ],
});
