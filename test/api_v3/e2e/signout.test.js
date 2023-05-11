'use strict'

import 'core-js/stable';
import 'regenerator-runtime/runtime';

import { app } from '../../testutils/fakeserver'
import api from '../../../src/api_v3/index'

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

  // step 1: GET form/signout
  await request(app).get(`/form/signout?a=apptest`)
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/signout_200_html_page/);
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['signout', { app: { id: 'apptest', url: 'url', realm: 'test', key: 'appkey' } }])

  const appId = helpers.form.mock.calls[0][1].app.id
  const realm = helpers.form.mock.calls[0][1].app.realm

  // step 2: DELETE session
  const cookie = createCookie('uid', realm)
  await request(app).delete('/session')
  .set('Cookie', [`${cookie[0]}=${cookie[1]}`])
  .set('Accept', 'application/json')
  .send({ app: appId, sid: JSON.parse(cookie[1]).sessionId })
  .expect(200)
  .expect('set-cookie', new RegExp(`${process.env.COOKIE_SESSION}_test=; Path=/`));

})
