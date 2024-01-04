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
      find: jest.fn(),
      Password: { update: jest.fn() },
    },
  },
  form: jest.fn(),
  hook: {
    sendEmail: jest.fn()
  }
}

api.helpers(helpers)

app.use('/', api.generate());

import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import request from 'supertest'

beforeEach( () => jest.clearAllMocks() )
beforeAll( () => setupEnvironmentVariables() )
afterAll( () => clearEnvironmentVariables() )


test('Request reset password and update the new one', async() => {

  const email = 'e2e@test.ext'

  helpers.Database.App.find.mockImplementation(
    ({id}) => id === 'apptest' || id === 'account' ?
                Promise.resolve({ id: id, url: 'url', realm: 'test', key: 'appkey' })
              :
                Promise.resolve(undefined)
  )
  const salty = { head: 'head', tail: 'tail' }
  helpers.Database.Account.find.mockResolvedValue({
    uid: 'uid',
    salty,
    profile: { fullname: 'Awesome' },
    realms: { test: { roles: ['member'] } }
  })
  helpers.Database.Account.Password.update.mockResolvedValue()
  helpers.hook.sendEmail.mockResolvedValue(undefined)
  helpers.form.mockReturnValue('200_html_page')

  // step 1: POST link/resetpassword
  await request(app).post(endpoint.Link.ResetPassword)
  .set('Accept', 'application/json')
  .send({ app: 'apptest', email })
  .expect(200)

  expect(helpers.hook.sendEmail).toHaveBeenCalledTimes(1)
  expect(helpers.hook.sendEmail.mock.calls[0]).toEqual([{
    to: { address: email, name: 'Awesome' },
    template: 'reset_password',
    data: { link: expect.any(String) },
  }])

  const link = helpers.hook.sendEmail.mock.calls[0][0].data.link
  const token = /^.*&t=(.*)/.exec(link)[1]

  // step 2: GET form/account/newpassword
  await request(app).get(`${endpoint.Form.NewPassword}?a=apptest&t=${token}`)
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/200_html_page/)
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['newpassword', { token: token, app: {id: 'apptest', url: 'url'} } ])

  // step 3: PUT account/password
  await request(app).put(endpoint.Account.Password)
  .set('Accept', 'application/json')
  .send({ app: 'apptest', password: 'password', token: token })
  .expect(200)

  expect(helpers.Database.Account.Password.update).toHaveBeenCalledTimes(1)
  expect(helpers.Database.Account.Password.update.mock.calls[0]).toEqual([
    'uid',
    hashPassword('password', salty)
  ])

})
