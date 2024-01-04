'use strict'

import 'core-js/stable';
import 'regenerator-runtime/runtime';

import request from 'supertest'
import jwt from 'jsonwebtoken'

import { api, app } from '../../testutils/fakeserver'
import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import funcs from '../../../src/api/resetpassword/reset_password'
const endpoint = '/account/password'
api.add(endpoint, { put: funcs })
app.use('/', api.generate());

const helpers = {
  Database: {
    App: {
      find: jest.fn(),
    },
    Account: {
      find: jest.fn(),
      Password: { update: jest.fn() },
    }
  }
}

api.helpers(helpers)

beforeEach( () => jest.clearAllMocks() )
beforeAll( () => setupEnvironmentVariables() )
afterAll( () => clearEnvironmentVariables() )


test('Validate request and response 400', async () => {

  await request(app).put(endpoint)
  .expect(400)

  await request(app).put(endpoint)
  .set('Accept', 'application/json')
  .send({ token: 'token' })
  .expect(400)

  await request(app).put(endpoint)
  .set('Accept', 'application/json')
  .send({ password: 'password' })
  .expect(400)

  await request(app).put(endpoint)
  .set('Accept', 'application/json')
  .send({ app: 'app' })
  .expect(400)

})


test('Decode token and reponse 400', async () => {

  await request(app).put(endpoint)
  .set('Accept', 'application/json')
  .send({ app: 'app', password: 'password', token: 'token' })
  .expect(400)

  const faketoken = jwt.sign({ uid: 'uid' }, 'Fake')
  await request(app).put(endpoint)
  .set('Accept', 'application/json')
  .send({ app: 'app', password: 'password', token: faketoken })
  .expect(400)

})


test('Verify app and response 403', async () => {

  helpers.Database.App.find.mockResolvedValueOnce(undefined)

  const token = jwt.sign({ uid: 'uid' }, process.env.EMAIL_VALLIDATION_SIGN_KEY)
  await request(app).put(endpoint)
  .set('Accept', 'application/json')
  .send({ app: 'app', password: 'password', token: token })
  .expect(403)

  helpers.Database.App.find.mockClear()

})


test('Verify uid existence and response 404', async () => {

  helpers.Database.App.find.mockResolvedValueOnce({})
  helpers.Database.Account.find.mockResolvedValueOnce(undefined)

  const token = jwt.sign({ uid: 'uid' }, process.env.EMAIL_VALLIDATION_SIGN_KEY)
  await request(app).put(endpoint)
  .set('Accept', 'application/json')
  .send({ app: 'app', password: 'password', token: token })
  .expect(404)

  expect(helpers.Database.Account.find).toHaveBeenCalledTimes(1)
  expect(helpers.Database.Account.find.mock.calls[0]).toEqual([{ uid: 'uid' }])

  helpers.Database.App.find.mockClear()
  helpers.Database.Account.find.mockClear()

})


test('Verify user realm and response 403', async () => {

  helpers.Database.App.find.mockResolvedValueOnce({ realm: 'test' })
  helpers.Database.Account.find.mockResolvedValueOnce({
    uid: 'uid',
    realms: { other: { roles: ['member'] } }
  })

  const token = jwt.sign({ uid: 'uid' }, process.env.EMAIL_VALLIDATION_SIGN_KEY)
  await request(app).put(endpoint)
  .set('Accept', 'application/json')
  .send({ app: 'app', password: 'password', token: token })
  .expect(404)

  helpers.Database.App.find.mockClear()
  helpers.Database.Account.find.mockClear()

})

import { hashPassword } from '../../../src/lib/util'
test('Change password and response 200', async () => {

  const salty = { head: 'head', tail: 'tail' }
  helpers.Database.App.find.mockResolvedValue({ realm: 'test' })
  helpers.Database.Account.find.mockResolvedValue({
    uid: 'uid',
    salty,
    realms: { test: { roles: ['member'] } }
  })
  helpers.Database.Account.Password.update.mockResolvedValue()

  const token = jwt.sign({ uid: 'uid' }, process.env.EMAIL_VALLIDATION_SIGN_KEY)
  await request(app).put(endpoint)
  .set('Accept', 'application/json')
  .send({ app: 'app', password: 'password', token: token })
  .expect(200)

  expect(helpers.Database.Account.Password.update).toHaveBeenCalledTimes(1)
  expect(helpers.Database.Account.Password.update.mock.calls[0]).toEqual([
    'uid',
    hashPassword('password', salty)
  ])

  helpers.Database.App.find.mockClear()
  helpers.Database.Account.find.mockClear()
  helpers.Database.Account.Password.update.mockClear()

})
