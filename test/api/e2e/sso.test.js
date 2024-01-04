'use strict'

import 'core-js/stable'
import 'regenerator-runtime/runtime'

import endpoint from '@realmjs/account-endpoint'

import { app } from '../../testutils/fakeserver'
import api from '../../../src/api/index'

import { hashPassword } from '../../../src/lib/util'

const helpers = {
  Database: {
    App: {
      find: jest.fn()
    },
    Account: {
      find: jest.fn()
    },
  },
  form: jest.fn()
}

api.helpers(helpers)

app.use('/', api.generate());

import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createCookie } from '../../../src/lib/util'

beforeEach( () => jest.clearAllMocks() )
beforeAll( () => setupEnvironmentVariables() )
afterAll( () => clearEnvironmentVariables() )


test('SSO a signed in session', async() => {

  helpers.Database.App.find.mockImplementation(
    ({id}) => id === 'apptest' || id === 'account' ?
                Promise.resolve({ id: id, url: 'url', realm: 'test', key: 'appkey' })
              :
                Promise.resolve(undefined)
  )
  helpers.form.mockReturnValue('sso_200_html_page')
  helpers.Database.Account.find.mockResolvedValue({
    uid: 'uid',
    email: 'e2e@test.ext',
    profile: { phone: '098', fullname: 'Awesome' },
    realms: { test: { roles: ['member'] } },
    credentials: { password: 'secret-hashed-string' },
    salty: { head: 'head', tail: 'tail' },
    created_at: 1234567890
  })

  const cookie = createCookie('uid', 'test')
  await request(app).get(`${endpoint.SSO}?a=apptest`)
  .set('Cookie', [`${cookie[0]}=${cookie[1]}`])
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/sso_200_html_page/)
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['sso', {
    user: {
      email: 'e2e@test.ext',
      profile: { phone: '098', fullname: 'Awesome' },
      created_at: 1234567890,
    },
    token: jwt.sign({uid: 'uid', roles: ['member']}, 'appkey'),
    sid: JSON.parse(cookie[1]).sessionId,
    app: {id: 'apptest', url: 'url'}
  }])

})
