"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import request from 'supertest'

import { api, app } from '../../testutils/fakeserver'
import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import funcs from '../../../src/api/signin/create_signin_session'
const endpoint = '/session'
api.add(endpoint, { post: funcs })
app.use('/', api.generate());

beforeEach( () => jest.clearAllMocks() )
beforeAll( () => setupEnvironmentVariables() )
afterAll( () => clearEnvironmentVariables() )

const helpers = {
  Database: {
    App: {
      find: jest.fn()
    },
    Account: {
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

  helpers.Database.App.find.mockResolvedValueOnce(undefined)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@exists.test', password: 'secret', app: 'invalid' })
  .expect(403)

  expect(helpers.Database.App.find).toHaveBeenCalledTimes(1)
  expect(helpers.Database.App.find.mock.calls[0]).toEqual([{id: 'invalid'}])

  helpers.Database.App.find.mockClear()

})


test('Check account existance and response 401', async () => {

  helpers.Database.App.find.mockResolvedValueOnce({})
  helpers.Database.Account.find.mockResolvedValueOnce(undefined)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@exists.test', password: 'secret', app: 'app' })
  .expect(401)
  .then( res => {
    expect(res.body).toEqual({})
    expect(res.header).not.toHaveProperty('set-cookie')
  })

  expect(helpers.Database.Account.find).toHaveBeenCalledTimes(1)
  expect(helpers.Database.Account.find.mock.calls[0]).toEqual([{ email: 'email@exists.test' }])

  helpers.Database.App.find.mockClear()
  helpers.Database.Account.find.mockClear()

})

test('Check user realms and response 401', async () => {

  helpers.Database.App.find.mockResolvedValue({ realm: 'test' })
  helpers.Database.Account.find.mockResolvedValueOnce({ realms: {} })
                               .mockResolvedValueOnce({ realms: { dev: ['member'] } })

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@exists.test', password: 'secret', app: 'app' })
  .expect(401)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@exists.test', password: 'secret', app: 'app' })
  .expect(401)
  .then( res => {
    expect(res.body).toEqual({})
    expect(res.header).not.toHaveProperty('set-cookie')
  })

  helpers.Database.App.find.mockClear()
  helpers.Database.Account.find.mockClear()

})


test('Check password and response 401', async () => {

  helpers.Database.App.find.mockResolvedValue({ realm: 'test' })
  helpers.Database.Account.find.mockResolvedValueOnce({
    realms: { test: ['member'] },
    credentials: { password: 'hashed' },
    salty: { head: 'head', tail: 'tail' }
  })

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@exists.test', password: 'wrong', app: 'app' })
  .expect(401)
  .then( res => {
    expect(res.body).toEqual({})
    expect(res.header).not.toHaveProperty('set-cookie')
  })

  helpers.Database.App.find.mockClear()
  helpers.Database.Account.find.mockClear()

})


import jwt from 'jsonwebtoken'
import { hashPassword } from '../../../src/lib/util'
test('Authenticate with response code 201', async () => {

  helpers.Database.App.find.mockResolvedValue({ realm: 'test', key: 'key' })
  helpers.Database.Account.find.mockResolvedValueOnce({
    uid: 'uid',
    email: 'email@test.ext',
    profile: { phone: '098', fullname: 'Awesome' },
    realms: { test: { roles: ['member'] } },
    credentials: { password: hashPassword('correct', { head: 'head', tail: 'tail' }) },
    salty: { head: 'head', tail: 'tail' },
    created_at: 1234567890
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
        profile: { phone: '098', fullname: 'Awesome' },
        created_at: 1234567890,
      },
      token: jwt.sign({uid: 'uid', roles: ['member']}, 'key'),
      sid: expect.any(String),
    })
  )

  helpers.Database.App.find.mockClear()
  helpers.Database.Account.find.mockClear()

})
