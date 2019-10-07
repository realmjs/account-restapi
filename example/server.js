"use strict"

require('dotenv').config()

const api = require('../src/api')

const express = require('express')

const app = express()

// const path = require('path')
// app.use('/assets', express.static(path.join(__dirname, '../build/clients')))

app.use('/', (req,res,next) => {console.log(`${req.method.toUpperCase()} request to: ${req.path}`); next()}, api.generate())

// setup hot reload
const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')

const config = require('../webpack.dev.config')
const compiler = webpack(config)
app.use(webpackDevMiddleware(compiler, {
  watchOptions: { poll: 1000 },
  publicPath: config.output.publicPath,
  stats: {colors: true}
}))
app.use(webpackHotMiddleware(compiler, {
  // log: console.log
}))

app.listen(3100, function(err) {
  if (err) {
    console.log('failed to start server!!!')
    console.log(err)
  } else {
    console.log('------------------------------------------------------------')
    console.log('- @realmjs/account-restapi server is running at port 3100')
    console.log('------------------------------------------------------------')
  }
})
