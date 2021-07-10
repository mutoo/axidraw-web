import MiniCssExtractPlugin from 'mini-css-extract-plugin';

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
      modules,
    },
  },
  {
    loader: 'postcss-loader',
  },
];

export const loadCss = () => ({
  plugins: [new MiniCssExtractPlugin()],
  module: {
    rules: [
      {
        test: /\.css$/,
        exclude: /node_modules/,
        oneOf: [
          {
            resourceQuery: /global/, // index.css?global
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
