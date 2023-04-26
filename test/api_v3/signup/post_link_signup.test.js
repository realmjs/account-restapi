'use strict'

import 'core-js/stable';
import 'regenerator-runtime/runtime';

import request from 'supertest'

import { api, app } from '../../testutils/fakeserver'
import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import funcs from '../../../src/api_v3/signup/post_link_signup'
const endpoint = '/signup/email'
api.add(endpoint, { post: funcs })
app.use('/', api.generate());

const helpers = {
  database: {
    apps: {
      find: jest.fn().mockResolvedValue({ url: 'host'})
    },
    account: {
      find: jest.fn()
    }
  },
  hook: {
    sendEmail: jest.fn()
  }
}

api.helpers(helpers)

beforeEach( () => jest.clearAllMocks() )
beforeAll( () => setupEnvironmentVariables() )
afterAll( () => clearEnvironmentVariables() )

test('Validate request and response 400 if missing email request body', async () => {

  await request(app).post(endpoint)
  .expect(400)

})


test('Validate request and response 400 for invalid email', async () => {

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email' })
  .expect(400)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@domain' })
  .expect(400)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email#domain' })
  .expect(400)

})


test('Verify email and reponse 409 if already exists', async () => {

  // setup
  helpers.database.account.find.mockResolvedValueOnce({ email: 'email@exists.test' })

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@exists.test' })
  .expect(409)

  expect(helpers.database.account.find).toHaveBeenCalledTimes(1)
  expect(helpers.database.account.find.mock.calls[0]).toEqual([{ email: 'email@exists.test' }])

  // tear down
  helpers.database.account.find.mockClear()

})


import jwt from 'jsonwebtoken';
import { hashEmail } from '../../../src/lib/util';

test('Create register link and pass it to helpers.hook.sendEmail, then reponse 200', async () => {

  //  setup
  helpers.database.account.find.mockResolvedValueOnce(undefined)
  helpers.hook.sendEmail.mockResolvedValueOnce(undefined)

  const email = 'email@unit.test'

  // test
  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email })
  .expect(200)

  const token = jwt.sign(
    { email: hashEmail(email) },
    process.env.EMAIL_VALLIDATION_SIGN_KEY,
    { expiresIn: process.env.EMAIL_EXPIRE_VALIDATION_LINK }
  )

  expect(helpers.hook.sendEmail).toHaveBeenCalledTimes(1)
  expect(helpers.hook.sendEmail.mock.calls[0]).toEqual([{
    email,
    link: expect.stringMatching(`email=${email}&token=${token}`),
  }])

  // tear down
  helpers.database.account.find.mockClear()
  helpers.hook.sendEmail.mockClear()

})