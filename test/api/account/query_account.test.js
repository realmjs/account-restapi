"use strict"

import 'core-js/stable';
import 'regenerator-runtime/runtime';

import request from 'supertest'
import jwt from 'jsonwebtoken'

import { api, app } from '../../testutils/fakeserver'
import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import funcs from '../../../src/api/account/query_account'
const endpoint = '/account/query/:uid'
api.add(endpoint, { get: funcs })
app.use('/', api.generate());

const helpers = {
  Database: {
    App: {
      find: jest.fn(),
    },
    Account: {
      find: jest.fn(),
    }
  },
  alert: msg => console.log(msg)
}

api.helpers(helpers)

beforeEach( () => jest.clearAllMocks() )
beforeAll( () => setupEnvironmentVariables() )
afterAll( () => clearEnvironmentVariables() )

test('Authenticate request permission', async () => {

  helpers.Database.App.find.mockResolvedValue({ id: 'account', url: 'url', realm: 'secure', key: 'securekey' })

  await
  request(app).get('/account/query/uid')
  .expect(401)

  const token = jwt.sign({ uid: 'admin' }, 'fake-key')
  await
  request(app).get('/account/query/uid')
  .set('Authorization', `Bearer ${token}`)
  .expect(401)

})

test('Find account and response 404 if non exist', async () => {
  helpers.Database.App.find.mockResolvedValue({ id: 'account', url: 'url', realm: 'secure', key: 'securekey' })
  helpers.Database.Account.find.mockResolvedValue(undefined)

  const token = jwt.sign({ uid: 'admin' }, 'securekey')
  await
  request(app).get('/account/query/uid')
  .set('Authorization', `Bearer ${token}`)
  .expect(404)

  expect(helpers.Database.Account.find).toHaveBeenCalledTimes(1)
  expect(helpers.Database.Account.find.mock.calls[0]).toEqual([{uid: 'uid'}])

})

test('Find and return account without sensitive information', async () => {
  helpers.Database.App.find.mockResolvedValue({ id: 'account', url: 'url', realm: 'secure', key: 'securekey' })
  helpers.Database.Account.find.mockResolvedValue({
    uid: 'uid',
    email: 'email@test.ext',
    credentials: { password: 'hash' },
    salty: { head: 'salty_head', tail: 'salty_tail' },
    profile: { phone: '098', fullName: 'Awesome' },
    createdAt: 123,
    realms: { test: { roles: ['member'] } }
  })

  const token = jwt.sign({ uid: 'admin' }, 'securekey')
  await
  request(app).get('/account/query/uid')
  .set('Authorization', `Bearer ${token}`)
  .expect(200)
  .then(
    res => expect(res.body).toEqual({
      uid: 'uid',
      email: 'email@test.ext',
      profile: { phone: '098', fullName: 'Awesome' },
      createdAt: 123,
    })
  )

  expect(helpers.Database.Account.find).toHaveBeenCalledTimes(1)
  expect(helpers.Database.Account.find.mock.calls[0]).toEqual([{uid: 'uid'}])

})