"use strict"
require('dotenv').config();

const api = require('../src/api');

const helpers = require('./helpers');

api.helpers(helpers);

const express = require('express')
const app = express()
app.use('/',
  (req,res,next) => {console.log(`${req.method.toUpperCase()} request to: ${req.path}`); next()},
  (req,res,next) => setTimeout(_ => next(), 0),
  api.generate()
);

// setup hot reload
const webpack = require('webpack');
const config = require('../webpack.dev.config');
const compiler = webpack(config);

const webpackDevMiddleware = require('webpack-dev-middleware');
app.use(webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath,
  stats: {colors: true}
}));

const webpackHotMiddleware = require('webpack-hot-middleware');
app.use(webpackHotMiddleware(compiler, {
  // log: console.log
}));

compiler.close(err => err && console.log(err));

app.listen(3100, function(err) {
  if (err) {
    console.log('failed to start server!!!');
    console.log(err);
  } else {
    console.log('------------------------------------------------------------');
    console.log('- @realmjs/account-restapi server is running at port 3100');
    console.log('------------------------------------------------------------');
  }
});
