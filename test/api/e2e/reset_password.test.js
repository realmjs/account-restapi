'use strict'

import 'core-js/stable';
import 'regenerator-runtime/runtime';

import { app } from '../../testutils/fakeserver'
import api from '../../../src/api/index'

import { hashPassword } from '../../../src/lib/util'

const helpers = {
  database: {
    app: {
      find: jest.fn()
    },
    account: {
      find: jest.fn(),
      update: jest.fn()
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

  helpers.database.app.find.mockImplementation(
    ({id}) => id === 'apptest' || id === 'account' ?
                Promise.resolve({ id: id, url: 'url', realm: 'test', key: 'appkey' })
              :
                Promise.resolve(undefined)
  )
  const salty = { head: 'head', tail: 'tail' }
  helpers.database.account.find.mockResolvedValue({
    uid: 'uid',
    salty,
    profile: { fullName: 'Awesome' },
    realms: { test: { roles: ['member'] } }
  })
  helpers.database.account.update.mockResolvedValue()
  helpers.hook.sendEmail.mockResolvedValue(undefined)
  helpers.form.mockReturnValue('200_html_page')

  // step 1: POST link/resetpassword
  await request(app).post('/link/resetpassword')
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
  await request(app).get(`/form/account/newpassword?a=apptest&t=${token}`)
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/200_html_page/)
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['newpassword', { token: token, app: {id: 'apptest', url: 'url'} } ])

  // step 3: PUT account/password 
  await request(app).put('/account/password')
  .set('Accept', 'application/json')
  .send({ app: 'apptest', password: 'password', token: token })
  .expect(200)

  expect(helpers.database.account.update).toHaveBeenCalledTimes(1)
  expect(helpers.database.account.update.mock.calls[0]).toEqual([
    { uid: 'uid' },
    'credentials.password',
    hashPassword('password', salty)
  ])

})
