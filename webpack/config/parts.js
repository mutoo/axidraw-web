import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { isProduction } from './utils';

export const loadJavascript = () => ({
  module: {
    rules: [
      {
        test: /\.jsx?/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {},
        },
      },
    ],
  },
});

const cssSharedLoaders = ({ modules } = { modules: false }) => [
  {
    loader: 'css-loader',
    options: {
      importLoaders: 1,
      modules: modules && {
        localIdentName: isProduction
          ? '[hash:base64:5]'
          : '[path][name]__[local]',
      },
    },
  },
  {
    loader: 'postcss-loader',
  },
];

export const loadCss = () => ({
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'styles.css',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        exclude: /node_modules/,
        oneOf: [
          {
            resourceQuery: /global/, // app.css?global
            use: [MiniCssExtractPlugin.loader, ...cssSharedLoaders()],
          },
          {
            // others
            use: ['style-loader', ...cssSharedLoaders({ modules: true })],
          },
        ],
      },
    ],
  },
});
