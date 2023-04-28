"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import request from 'supertest'

import { api, app } from '../../testutils/fakeserver'
import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import funcs from '../../../src/api_v3/signin/create_signin_session'
const endpoint = '/session'
api.add(endpoint, { post: funcs })
app.use('/', api.generate());

beforeEach( () => jest.clearAllMocks() )
beforeAll( () => setupEnvironmentVariables() )
afterAll( () => clearEnvironmentVariables() )

const helpers = {
  database: {
    app: {
      find: jest.fn()
    },
    account: {
      find: jest.fn()
    },
  },
}

api.helpers(helpers)

test('Validate request and response 400', async () => {

  await request(app).post(endpoint)
  .expect(400)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@domain.ext' })
  .expect(400)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ app: 'app' })
  .expect(400)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ password: 'secret' })
  .expect(400)

})


test('Validate app and response 403', async () => {

  helpers.database.app.find.mockResolvedValueOnce(undefined)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@exists.test', password: 'secret', app: 'invalid' })
  .expect(403)

  expect(helpers.database.app.find).toHaveBeenCalledTimes(1)
  expect(helpers.database.app.find.mock.calls[0]).toEqual([{id: 'invalid'}])

  helpers.database.app.find.mockClear()

})


test('Check account existance and response 401', async () => {

  helpers.database.app.find.mockResolvedValueOnce({})
  helpers.database.account.find.mockResolvedValueOnce(undefined)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@exists.test', password: 'secret', app: 'app' })
  .expect(401)

  expect(helpers.database.account.find).toHaveBeenCalledTimes(1)
  expect(helpers.database.account.find.mock.calls[0]).toEqual([{ email: 'email@exists.test' }])

  helpers.database.app.find.mockClear()
  helpers.database.account.find.mockClear()

})

test('Check user realms and response 401', async () => {

  helpers.database.app.find.mockResolvedValue({ realm: 'test' })
  helpers.database.account.find.mockResolvedValueOnce({ realms: {} })
                               .mockResolvedValueOnce({ realms: { dev: ['member'] } })

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@exists.test', password: 'secret', app: 'app' })
  .expect(401)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@exists.test', password: 'secret', app: 'app' })
  .expect(401)

  helpers.database.app.find.mockClear()
  helpers.database.account.find.mockClear()

})


test('Check password and response 401', async () => {

  helpers.database.app.find.mockResolvedValue({ realm: 'test' })
  helpers.database.account.find.mockResolvedValueOnce({
    realms: { test: ['member'] },
    credentials: { password: 'hashed' },
    salty: { head: 'head', tail: 'tail' }
  })

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@exists.test', password: 'wrong', app: 'app' })
  .expect(401)

  helpers.database.app.find.mockClear()
  helpers.database.account.find.mockClear()

})

import { hashPassword } from '../../../src/lib/util'
test('Authenticate with response code 201', async () => {

  helpers.database.app.find.mockResolvedValue({ realm: 'test', key: 'key' })
  helpers.database.account.find.mockResolvedValueOnce({
    uid: 'secret-uid',
    email: 'email@test.ext',
    profile: { phone: '098', fullName: 'Awesome' },
    realms: { test: ['member'] },
    credentials: { password: hashPassword('correct', { head: 'head', tail: 'tail' }) },
    salty: { head: 'head', tail: 'tail' },
    createdAt: 1234567890
  })

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@exists.test', password: 'correct', app: 'app' })
  .expect(200)
  .expect('set-cookie', new RegExp(`${process.env.COOKIE_SESSION}_test=.+; Path=/; HttpOnly`))
  .then( res =>
    expect(res.body).toEqual({
      user: {
        email: 'email@test.ext',
        profile: { phone: '098', fullName: 'Awesome' },
        createdAt: 1234567890,
      },
      token: expect.any(String),
      sid: expect.any(String),
    })
  )

  helpers.database.app.find.mockClear()
  helpers.database.account.find.mockClear()

})
