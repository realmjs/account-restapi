'use strict'
import jwt from 'jsonwebtoken';
import { isEmail } from '../../lib/form'
import { hashEmail } from '../../lib/util'

const validateRequest = () => (req, res, next) => {
  if (req.body.email && isEmail(req.body.email)) {
    next()
  } else {
    res.status(400).send('Bad Request')
  }
}

const checkEmailExistence = (helpers) => (req, res, next) => {
  helpers.database.account.find({ email: req.body.email })
  .then( user => {
    if (user) {
      res.status(409).send('Email is registered')
    } else {
      next()
    }
  })
  .catch( err => console.log(err))
}

const createRegisterLink = () => (req, res, next) => {
  res.locals.token = jwt.sign(
    { email: hashEmail(req.body.email) },
    process.env.EMAIL_VALLIDATION_SIGN_KEY,
    { expiresIn: process.env.EMAIL_EXPIRE_VALIDATION_LINK }
  )
  next()
}

const sendEmail = (helpers) => (req, res, next) => {
  const email = req.body.email
  const token = res.locals.token

  helpers.database.apps.find({id: 'account'})
  .then(account => {
    helpers.hook.sendEmail({
      email: req.body.email,
      link: `${account.url}/form/account/new?email=${email}&token=${token}`
    })
    .then( () => next() )
  })
  .catch( err => console.log(err) )
}

const final = () => (req, res) => res.status(200).send('Register link is sent')

module.exports = [
  validateRequest,
  checkEmailExistence,
  createRegisterLink,
  sendEmail,
  final
]
