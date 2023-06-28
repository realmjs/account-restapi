'use strict'

import 'core-js/stable';
import 'regenerator-runtime/runtime';

import request from 'supertest'

import { api, app } from '../../testutils/fakeserver'
import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import funcs from '../../../src/api/resetpassword/create_link_resetpassword'
const endpoint = '/link/resetpassword'
api.add(endpoint, { post: funcs })
app.use('/', api.generate());

const helpers = {
  Database: {
    App: {
      find: jest.fn()
    },
    Account: {
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

})


test('Validate app and response 403', async () => {

  helpers.Database.App.find.mockResolvedValueOnce(undefined)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ app: 'app', email: 'email@domain.ext' })
  .expect(403)

  helpers.Database.App.find.mockClear()

})


test('Verify email and response 404', async () => {

  helpers.Database.App.find.mockResolvedValueOnce({})
  helpers.Database.Account.find.mockResolvedValueOnce(undefined)


  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ app: 'app', email: 'notexistemail@domain.ext' })
  .expect(404)

  helpers.Database.App.find.mockClear()
  helpers.Database.Account.find.mockClear()

})


test('Verify realms and response 403', async () => {

  helpers.Database.App.find.mockResolvedValueOnce({realm: 'test', key: 'appkey'})
  helpers.Database.Account.find.mockResolvedValueOnce({
    uid: 'uid',
    realms: { other: { roles: ['member'] } }
  })


  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ app: 'app', email: 'notexistemail@domain.ext' })
  .expect(403)

  helpers.Database.App.find.mockClear()
  helpers.Database.Account.find.mockClear()

})


import jwt from 'jsonwebtoken'
test('Generate reset link and call send email hook', async () => {

  const email = 'email@unit.test'

  helpers.Database.App.find.mockResolvedValue({realm: 'test', url: 'url'})
  helpers.Database.Account.find.mockResolvedValue({
    uid: 'uid',
    profile: { fullName: 'Awesome' },
    realms: { test: { roles: ['member'] } }
  })
  helpers.hook.sendEmail.mockResolvedValue(undefined)

  await request(app).post(endpoint)
  .set('Accept', 'application/json')
  .send({ app: 'app', email })
  .expect(200)

  const token = jwt.sign(
    { uid: 'uid' },
    process.env.EMAIL_VALLIDATION_SIGN_KEY,
    { expiresIn: process.env.EMAIL_EXPIRE_VALIDATION_LINK }
  )

  expect(helpers.hook.sendEmail).toHaveBeenCalledTimes(1)
  expect(helpers.hook.sendEmail.mock.calls[0]).toEqual([{
    to: { address: email, name: 'Awesome' },
    template: 'reset_password',
    data: { link: expect.stringMatching(`a=app&t=${token}`) },
  }])

  helpers.Database.App.find.mockClear()
  helpers.Database.Account.find.mockClear()
  helpers.hook.sendEmail.mockClear()

})

