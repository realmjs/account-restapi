'use strict'

import 'core-js/stable';
import 'regenerator-runtime/runtime';

import request from 'supertest'
import jwt from 'jsonwebtoken'

import { api, app } from '../../testutils/fakeserver'
import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import funcs from '../../../src/api_v3/resetpassword/reset_password'
const endpoint = '/account/password'
api.add(endpoint, { put: funcs })
app.use('/', api.generate());

const helpers = {
  database: {
    app: {
      find: jest.fn(),
    },
    account: {
      find: jest.fn(),
      update: jest.fn(),
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

  helpers.database.app.find.mockResolvedValueOnce(undefined)

  const token = jwt.sign({ uid: 'uid' }, process.env.EMAIL_VALLIDATION_SIGN_KEY)
  await request(app).put(endpoint)
  .set('Accept', 'application/json')
  .send({ app: 'app', password: 'password', token: token })
  .expect(403)

  helpers.database.app.find.mockClear()

})


test('Verify uid existence and response 404', async () => {

  helpers.database.app.find.mockResolvedValueOnce({})
  helpers.database.account.find.mockResolvedValueOnce(undefined)

  const token = jwt.sign({ uid: 'uid' }, process.env.EMAIL_VALLIDATION_SIGN_KEY)
  await request(app).put(endpoint)
  .set('Accept', 'application/json')
  .send({ app: 'app', password: 'password', token: token })
  .expect(404)

  expect(helpers.database.account.find).toHaveBeenCalledTimes(1)
  expect(helpers.database.account.find.mock.calls[0]).toEqual([{ uid: 'uid' }])

  helpers.database.app.find.mockClear()
  helpers.database.account.find.mockClear()

})


test('Verify user realm and response 403', async () => {

  helpers.database.app.find.mockResolvedValueOnce({ realm: 'test' })
  helpers.database.account.find.mockResolvedValueOnce({
    uid: 'uid',
    realms: { other: { roles: ['member'] } }
  })

  const token = jwt.sign({ uid: 'uid' }, process.env.EMAIL_VALLIDATION_SIGN_KEY)
  await request(app).put(endpoint)
  .set('Accept', 'application/json')
  .send({ app: 'app', password: 'password', token: token })
  .expect(404)

  helpers.database.app.find.mockClear()
  helpers.database.account.find.mockClear()

})

import { hashPassword } from '../../../src/lib/util'
test('Change password and response 200', async () => {

  const salty = { head: 'head', tail: 'tail' }
  helpers.database.app.find.mockResolvedValue({ realm: 'test' })
  helpers.database.account.find.mockResolvedValue({
    uid: 'uid',
    salty,
    realms: { test: { roles: ['member'] } }
  })
  helpers.database.account.update.mockResolvedValue()

  const token = jwt.sign({ uid: 'uid' }, process.env.EMAIL_VALLIDATION_SIGN_KEY)
  await request(app).put(endpoint)
  .set('Accept', 'application/json')
  .send({ app: 'app', password: 'password', token: token })
  .expect(200)

  expect(helpers.database.account.update).toHaveBeenCalledTimes(1)
  expect(helpers.database.account.update.mock.calls[0]).toEqual([
    { uid: 'uid' },
    'credentials.password',
    hashPassword('password', salty)
  ])

  helpers.database.app.find.mockClear()
  helpers.database.account.find.mockClear()
  helpers.database.account.update.mockClear()

})
