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
  form: jest.fn()
}

api.helpers(helpers)

app.use('/', api.generate());

import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import request from 'supertest'
import jwt from 'jsonwebtoken'

beforeEach( () => jest.clearAllMocks() )
beforeAll( () => setupEnvironmentVariables() )
afterAll( () => clearEnvironmentVariables() )


test('Request change password and update the new one', async() => {

  helpers.form.mockReturnValue('200_html_page')
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
    realms: { test: { roles: ['member'] } },
    credentials: { password: hashPassword('current', salty) },
  })
  helpers.database.account.update.mockResolvedValue()

  // step 1: Get form/account/changepassword
  await request(app).get(`/form/account/changepassword?a=apptest`)
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/200_html_page/);
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['changepassword', { app: {id: 'apptest', url: 'url'} }])

  // step 2: PUT me/password
  const token = jwt.sign({ uid: 'uid' }, process.env.EMAIL_VALLIDATION_SIGN_KEY)
  await request(app).put('/me/password')
  .set('Accept', 'application/json')
  .send({ app: 'apptest', password: { current: 'current', new: 'new' }, token: token })
  .expect(200)

  expect(helpers.database.account.update).toHaveBeenCalledTimes(1)
  expect(helpers.database.account.update.mock.calls[0]).toEqual([
    { uid: 'uid' },
    'credentials.password',
    hashPassword('new', salty)
  ])

})


test('Prevent update password if currunt password is not matched', async() => {

  helpers.form.mockReturnValue('200_html_page')
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
    realms: { test: { roles: ['member'] } },
    credentials: { password: hashPassword('current', salty) },
  })
  helpers.database.account.update.mockResolvedValue()

  // step 1: Get form/account/changepassword
  await request(app).get(`/form/account/changepassword?a=apptest`)
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/200_html_page/);
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['changepassword', { app: {id: 'apptest', url: 'url'} }])

  // step 2: PUT me/password
  const token = jwt.sign({ uid: 'uid' }, process.env.EMAIL_VALLIDATION_SIGN_KEY)
  await request(app).put('/me/password')
  .set('Accept', 'application/json')
  .send({ app: 'apptest', password: { current: 'wrong', new: 'new' }, token: token })
  .expect(403)

  expect(helpers.database.account.update).not.toHaveBeenCalled()
  
})