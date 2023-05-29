'use strict'

import 'core-js/stable'
import 'regenerator-runtime/runtime'

import endpoint from '@realmjs/account-endpoint'

import { app } from '../../testutils/fakeserver'
import api from '../../../src/api/index'

const helpers = {
  database: {
    app: {
      find: jest.fn()
    },
    account: {
      find: jest.fn(),
      insert: jest.fn()
    },
  },
  hook: {
    sendEmail: jest.fn(),
    onCreatedUser: jest.fn()
  },
  form: jest.fn()
}

api.helpers(helpers)

app.use('/', api.generate());

import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import request from 'supertest'
import { createCookie } from '../../../src/lib/util'

beforeEach( () => jest.clearAllMocks() )
beforeAll( () => setupEnvironmentVariables() )
afterAll( () => clearEnvironmentVariables() )


test('Signout a session', async() => {

  helpers.database.app.find.mockImplementation(
    ({id}) => id === 'apptest' || id === 'account' ?
                Promise.resolve({ id: id, url: 'url', realm: 'test', key: 'appkey' })
              :
                Promise.resolve(undefined)
  )
  helpers.form.mockReturnValueOnce('signout_200_html_page')

  const cookie = createCookie('uid', 'test')
  const sid = JSON.parse(cookie[1]).sessionId

  // step 1: GET form/signout
  await request(app).get(`${endpoint.Form.Signout}?a=apptest&s=${sid}`)
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/signout_200_html_page/);
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['signout', { app: {id: 'apptest', url: 'url'}, sid: sid }])

  // step 2: DELETE session

  await request(app).delete('/session')
  .set('Cookie', [`${cookie[0]}=${cookie[1]}`])
  .set('Accept', 'application/json')
  .send({ app: 'apptest', sid: sid })
  .expect(200)
  .expect('set-cookie', new RegExp(`${process.env.COOKIE_SESSION}_test=; Path=/`));

})
