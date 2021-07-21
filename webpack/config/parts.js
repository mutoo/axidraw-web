import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { isProduction } from './utils';
import { plugins } from '../../babel.config.json';

export const loadJavascript = () => ({
  module: {
    rules: [
      {
        test: /\.jsx?/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              ...plugins,
              isProduction ? null : 'react-refresh/babel',
            ].filter(Boolean),
          },
        },
      },
    ],
  },
});

export const loadImages = () => ({
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        exclude: /node_modules/,
        use: {
          loader: 'file-loader',
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
