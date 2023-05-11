'use strict'

import 'core-js/stable';
import 'regenerator-runtime/runtime';

import { app } from '../../testutils/fakeserver'
import api from '../../../src/api_v3/index'

import { hashPassword } from '../../../src/lib/util'

const helpers = {
  database: {
    app: {
      find: jest.fn()
    },
    account: {
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

  helpers.database.app.find.mockImplementation(
    ({id}) => id === 'apptest' || id === 'account' ?
                Promise.resolve({ id: id, url: 'url', realm: 'test', key: 'appkey' })
              :
                Promise.resolve(undefined)
  )
  helpers.form.mockReturnValue('sso_200_html_page')
  helpers.database.account.find.mockResolvedValue({
    uid: 'uid',
    email: 'e2e@test.ext',
    profile: { phone: '098', fullName: 'Awesome' },
    realms: { test: { roles: ['member'] } },
    credentials: { password: 'secret-hashed-string' },
    salty: { head: 'head', tail: 'tail' },
    createdAt: 1234567890
  })

  const cookie = createCookie('uid', 'test')
  await request(app).get(`/session/sso?a=apptest`)
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
      profile: { phone: '098', fullName: 'Awesome' },
      createdAt: 1234567890,
    },
    token: jwt.sign({uid: 'uid', roles: ['member']}, 'appkey'),
    sid: JSON.parse(cookie[1]).sessionId,
    app: { url: 'url' }
  }])

})
