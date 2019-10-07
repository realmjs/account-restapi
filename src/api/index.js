"use strict"

const Builder = require('express-api-builder')

const api = Builder()

api.use(require('cookie-parser')())

/* forms */
api.add('/form', {
  get: require('./form/render-form')
})

module.exports = api
