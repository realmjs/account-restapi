'use strict'

import 'core-js/stable';
import 'regenerator-runtime/runtime';

import request from 'supertest'

import { api, app } from '../../testutils/fakeserver'
import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import funcs from '../../../src/api/signup/create_newaccount'
const endpoint = '/account'
api.add(endpoint, { post: funcs })
app.use('/', api.generate());

const helpers = {
  Database: {
    App: {
      find: jest.fn(),
    },
    Account: {
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
  .send({ email: 'email@exists.test', password: 'secret', profile: { phone: '098', fullname: 'Awesome' } })
  .expect(400)

})


test('Response 403 if verify app failed', async () => {

  helpers.Database.App.find.mockResolvedValueOnce(undefined)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@exists.test', password: 'secret', profile: { fullname: 'Awesome' }, app: 'invalid' })
  .expect(403)

  expect(helpers.Database.App.find).toHaveBeenCalledTimes(1)
  expect(helpers.Database.App.find.mock.calls[0]).toEqual([{id: 'invalid'}])

  helpers.Database.App.find.mockClear()

})


test('Response 409 if email is already registered', async () => {

  helpers.Database.App.find.mockResolvedValueOnce({})
  helpers.Database.Account.find.mockResolvedValueOnce({ email: 'email@exists.test' })

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@exists.test', password: 'secret', profile: { phone: '098', fullname: 'Awesome' }, app: 'test' })
  .expect(409)

  expect(helpers.Database.Account.find).toHaveBeenCalledTimes(1)
  expect(helpers.Database.Account.find.mock.calls[0]).toEqual([{ email: 'email@exists.test' }])

  helpers.Database.Account.find.mockClear()
  helpers.Database.App.find.mockClear()

})


test('Create new account, call helpers.hook to send email and callback', async () => {

  helpers.Database.App.find.mockResolvedValueOnce({ realm: 'test', key: 'appkey' })
  helpers.Database.Account.find.mockResolvedValue(undefined)
  helpers.Database.Account.insert.mockResolvedValue(undefined)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@test.ext', password: 'secret', profile: { phone: '098', fullname: 'Awesome' }, app: 'test' })
  .expect(200)
  .expect('set-cookie', new RegExp(`${process.env.COOKIE_SESSION}_test=.+; Path=/; HttpOnly`))
  .then( res =>
    expect(res.body).toEqual({
      user: {
        email: 'email@test.ext',
        profile: { phone: '098', fullname: 'Awesome' },
        created_at: expect.any(String),
      },
      token: expect.any(String),
      sid: expect.any(String),
    })
  )

  expect(helpers.Database.Account.insert).toHaveBeenCalledTimes(1)
  expect(helpers.Database.Account.insert.mock.calls[0]).toEqual([{
    uid: expect.any(String),
    email: 'email@test.ext',
    credentials: { password: expect.any(String) },
    salty: { head: expect.any(String), tail: expect.any(String) },
    profile: { phone: '098', fullname: 'Awesome' },
    created_at: expect.any(Date),
    realms: { test: { roles: ['member'] } }
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
    profile: { phone: '098', fullname: 'Awesome' },
    created_at: expect.any(Date),
    realms: { test: { roles: ['member'] } }
  }])

  helpers.Database.Account.find.mockClear()
  helpers.Database.Account.insert.mockClear()
  helpers.hook.sendEmail.mockClear()
  helpers.hook.onCreatedUser.mockClear()
  helpers.Database.App.find.mockClear()

})


test('Guarantee no dupplicate uid when creating account', async () => {

  helpers.Database.App.find.mockResolvedValueOnce({ realm: 'test', key: 'appkey' })
  helpers.Database.Account.find
  .mockResolvedValueOnce(undefined)  // find email
  .mockResolvedValueOnce({})         // find uid
  .mockResolvedValueOnce(undefined)  // second try with another uid
  helpers.Database.Account.insert.mockResolvedValue(undefined)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ email: 'email@test.ext', password: 'secret', profile: { phone: '098', fullname: 'Awesome' }, app: 'test' })
  .expect(200)

  expect(helpers.Database.Account.find).toHaveBeenCalledTimes(3)
  expect(helpers.Database.Account.find.mock.calls[1]).toEqual([{ uid: expect.any(String) }])
  expect(helpers.Database.Account.find.mock.calls[2]).toEqual([{ uid: expect.any(String) }])

  helpers.Database.Account.find.mockClear()
  helpers.Database.Account.insert.mockClear()
  helpers.hook.sendEmail.mockClear()
  helpers.hook.onCreatedUser.mockClear()
  helpers.Database.App.find.mockClear()

})
