// Webpack uses this to work with directories
const path = require('path');
const webpack = require('webpack'); //to access built-in plugins
const CopyPlugin = require("copy-webpack-plugin");

// This is the main configuration object.
// Here you write different options and tell Webpack what to do
module.exports = {

  // Path to your entry point. From this file Webpack will begin his work
  entry: './src/box.js',

  // Enable source mapping
  // devtool: 'source-map',

  // Path and filename of your result bundle.
  // Webpack will bundle all JavaScript into this file
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js'
  },

  devServer: {
    // contentBase: path.join(__dirname, 'dist'),
    static: path.join(__dirname, 'dist'),
    // compress: true,
    port: 8080
  },

  // Default mode for Webpack is production.
  // Depending on mode Webpack will apply different things
  // on final bundle. For now we don't need production's JavaScript
  // minifying and other thing so let's set mode to development
  mode: 'development',
  // mode: 'production',

  plugins: [
    new webpack.ProvidePlugin({
      THREE: 'three',
      
      // https://github.com/webpack/changelog-v5/issues/10
      Buffer: ['buffer', 'Buffer'],
    }),

    new CopyPlugin(
      {
        patterns: [
          {from :"node_modules/three/examples/js/libs/basis/", to:"basis"}
        ]
      }
    ),
    // new CopyPlugin({
    //   patterns: [
    //     { from: "node_modules/@webxr-input-profiles/assets/dist/profiles", to: "profiles" }
    //   ],
    // }),
  ],

  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },

  performance: { hints: false }

};
