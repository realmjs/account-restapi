"use strict"

const path = require("path")

module.exports = {
  entry: {
    app: './src/client/script/app.js'
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name].js",
  },
  resolve: { extensions: ['.js', '.jsx'] },
  module: {
    rules: [
      {
        test: /(\.js?$)|(\.jsx?$)/,
        use: 'babel-loader',
      }
    ]
  },
  mode: 'production',
  devtool: 'inline-source-map'
}
