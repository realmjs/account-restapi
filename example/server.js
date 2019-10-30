"use strict"

require('dotenv').config()

const api = require('../src/api')

const aws = { region: process.env.REGION, endpoint: process.env.ENDPOINT }
if (process.env.PROXY) {
  const proxy = require('proxy-agent')
  aws.httpOptions = { agent: proxy(process.env.PROXY) }
}

const DatabaseHelper = require('@realmjs/dynamodb-helper')
const dbh = new DatabaseHelper({ aws })
dbh.addTable('USERS', {indexes: ['LOGIN']})
api.helpers({ Database: dbh.drivers})

api.helpers({ sendEmail: ({recipient, template, data}) => {
  return new Promise( (resolve, reject) => {
    console.log(`   --> sent email to:`)
    recipient.forEach( ({name, email}) => {
      console.log(`           + ${name}[${email}]`)
    })
    console.log(`   --> email template: ${template}`)
    console.log(`   --> data: ${JSON.stringify(data)}`)
    resolve()
  })
}})

api.helpers({ alert : msg => console.log(msg) })

const express = require('express')
const app = express()
app.use('/',
  (req,res,next) => {console.log(`${req.method.toUpperCase()} request to: ${req.path}`); next()},
  (req,res,next) => setTimeout(_ => next(), 0),
  api.generate()
)

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
