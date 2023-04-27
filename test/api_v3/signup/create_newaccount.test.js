'use strict'

import 'core-js/stable';
import 'regenerator-runtime/runtime';

import request from 'supertest'

import { api, app } from '../../testutils/fakeserver'
import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import funcs from '../../../src/api_v3/signup/create_newaccount'
const endpoint = '/account'
api.add(endpoint, { post: funcs })
app.use('/', api.generate());

const helpers = {
  database: {
    app: {
      find: jest.fn(),
    },
    account: {
      find: jest.fn(),
      insert: jest.fn(),
    }
  },
  hook: {
    sendEmail: jest.fn().mockResolvedValue(),
    onCreatedUser: jest.fn().mockResolvedValue(),
  }
}

api.helpers(helpers)

beforeEach( () => jest.clearAllMocks() )
beforeAll( () => setupEnvironmentVariables() )
afterAll( () => clearEnvironmentVariables() )


test('Validate request and response 400 if missing parameters', async () => {

  await request(app).post(endpoint)
  .expect(400)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@test.ext' })
  .expect(400)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ password: 'secret' })
  .expect(400)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@test.ext', password: 'secret' })
  .expect(400)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@test.ext', password: 'secret', profile: { phone: '098' } })
  .expect(400)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@exists.test', password: 'secret', profile: { phone: '098', fullName: 'Awesome' } })
  .expect(400)

})


test('Response 403 if verify app failed', async () => {

  helpers.database.app.find.mockResolvedValueOnce(undefined)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@exists.test', password: 'secret', profile: { fullName: 'Awesome' }, app: 'invalid' })
  .expect(403)

  expect(helpers.database.app.find).toHaveBeenCalledTimes(1)
  expect(helpers.database.app.find.mock.calls[0]).toEqual([{id: 'invalid'}])

  helpers.database.app.find.mockClear()

})


test('Response 409 if email is already registered', async () => {

  helpers.database.app.find.mockResolvedValueOnce({})
  helpers.database.account.find.mockResolvedValueOnce({ email: 'email@exists.test' })

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@exists.test', password: 'secret', profile: { phone: '098', fullName: 'Awesome' }, app: 'test' })
  .expect(409)

  expect(helpers.database.account.find).toHaveBeenCalledTimes(1)
  expect(helpers.database.account.find.mock.calls[0]).toEqual([{ email: 'email@exists.test' }])

  helpers.database.account.find.mockClear()
  helpers.database.app.find.mockClear()

})


test('Create new account, call helpers.hook to send email and callback', async () => {

  helpers.database.app.find.mockResolvedValueOnce({ realm: 'test', key: 'appkey' })
  helpers.database.account.find.mockResolvedValue(undefined)
  helpers.database.account.insert.mockResolvedValue(undefined)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@test.ext', password: 'secret', profile: { phone: '098', fullName: 'Awesome' }, app: 'test' })
  .expect(200)
  .expect('set-cookie', new RegExp(`${process.env.COOKIE_SESSION}_test=.+; Path=/; HttpOnly`))
  .then( res =>
    expect(res.body).toEqual({
      user: {
        email: 'email@test.ext',
        profile: { phone: '098', fullName: 'Awesome' },
        createdAt: expect.any(Number),
      },
      token: expect.any(String),
      sid: expect.any(String),
    })
  )

  expect(helpers.database.account.insert).toHaveBeenCalledTimes(1)
  expect(helpers.database.account.insert.mock.calls[0]).toEqual([{
    uid: expect.any(String),
    email: 'email@test.ext',
    credentials: { password: expect.any(String) },
    salty: { head: expect.any(String), tail: expect.any(String) },
    profile: { phone: '098', fullName: 'Awesome' },
    createdAt: expect.any(Number),
    realms: { test: ['member'] }
  }])

  expect(helpers.hook.sendEmail).toHaveBeenCalledTimes(1)
  expect(helpers.hook.sendEmail.mock.calls[0]).toEqual([{
    to: { address: 'email@test.ext', name: 'Awesome' },
    template: 'welcome_new_user'
  }])

  expect(helpers.hook.onCreatedUser).toHaveBeenCalledTimes(1)
  expect(helpers.hook.onCreatedUser.mock.calls[0]).toEqual([{
    uid: expect.any(String),
    email: 'email@test.ext',
    profile: { phone: '098', fullName: 'Awesome' },
    createdAt: expect.any(Number),
    realms: { test: ['member'] }
  }])

  helpers.database.account.find.mockClear()
  helpers.database.account.insert.mockClear()
  helpers.hook.sendEmail.mockClear()
  helpers.hook.onCreatedUser.mockClear()
  helpers.database.app.find.mockClear()

})


test('Guarantee no dupplicate uid when creating account', async () => {

  helpers.database.app.find.mockResolvedValueOnce({ realm: 'test', key: 'appkey' })
  helpers.database.account.find
  .mockResolvedValueOnce(undefined)  // find email
  .mockResolvedValueOnce({})         // find uid
  .mockResolvedValueOnce(undefined)  // second try with another uid
  helpers.database.account.insert.mockResolvedValue(undefined)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@test.ext', password: 'secret', profile: { phone: '098', fullName: 'Awesome' }, app: 'test' })
  .expect(200)

  expect(helpers.database.account.find).toHaveBeenCalledTimes(3)
  expect(helpers.database.account.find.mock.calls[1]).toEqual([{ uid: expect.any(String) }])
  expect(helpers.database.account.find.mock.calls[2]).toEqual([{ uid: expect.any(String) }])

  helpers.database.account.find.mockClear()
  helpers.database.account.insert.mockClear()
  helpers.hook.sendEmail.mockClear()
  helpers.hook.onCreatedUser.mockClear()
  helpers.database.app.find.mockClear()

})
