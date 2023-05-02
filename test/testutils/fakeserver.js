"use strict"

const Builder = require('express-api-builder')
const api = Builder()

api.use(require('cookie-parser')())

import express from 'express'
const app = express()

module.exports = { api, app }
