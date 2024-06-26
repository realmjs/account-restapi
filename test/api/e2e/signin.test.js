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
    LoginSession: {
      remove: jest.fn(),
      insert: jest.fn()
    }
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


test('Signin with a registered account', async() => {

  helpers.Database.App.find.mockImplementation(
    ({id}) => id === 'apptest' || id === 'account' ?
                Promise.resolve({ id: id, url: 'url', realm: 'test', key: 'appkey' })
              :
                Promise.resolve(undefined)
  )
  helpers.form.mockReturnValue('mock_html_page')
  helpers.Database.Account.find.mockResolvedValue({
    uid: 'uid',
    email: 'e2e@test.ext',
    profile: { phone: '098', fullname: 'Awesome' },
    realms: { test: { roles: ['member'] } },
    credentials: { password: hashPassword('correct', { head: 'head', tail: 'tail' }) },
    salty: { head: 'head', tail: 'tail' },
    created_at: 1234567890
  })
  helpers.Database.LoginSession.remove.mockResolvedValue()
  helpers.Database.LoginSession.insert.mockResolvedValue()

  // step 1: GET form/signin
  await request(app).get(`${endpoint.Form.Signin}?a=apptest`)
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/mock_html_page/);
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['signin', { app: { id: 'apptest', url: 'url' } }])

  // step 2: POST session
  await request(app).post(endpoint.Session)
  .set('Accept', 'application/json')
  .send({ email: 'e2e@test.ext', password: 'correct', app: 'apptest' })
  .expect(200)
  .expect('set-cookie', new RegExp(`${process.env.COOKIE_SESSION}_test=.+; Path=/; HttpOnly`))
  .then( res =>
    expect(res.body).toEqual({
      user: {
        email: 'e2e@test.ext',
        profile: { phone: '098', fullname: 'Awesome' },
        created_at: 1234567890,
      },
      token: jwt.sign({uid: 'uid', sid: helpers.Database.LoginSession.insert.mock.calls[0][0].sid}, 'appkey'),
    })
  )

})


test('Signin with a registered account but wrong password', async() => {

  helpers.Database.App.find.mockImplementation(
    ({id}) => id === 'apptest' || id === 'account' ?
                Promise.resolve({ id: id, url: 'url', realm: 'test', key: 'appkey' })
              :
                Promise.resolve(undefined)
  )
  helpers.form.mockReturnValue('mock_html_page')
  helpers.Database.Account.find.mockResolvedValue({
    uid: 'uid',
    email: 'e2e@test.ext',
    profile: { phone: '098', fullname: 'Awesome' },
    realms: { test: { roles: ['member'] } },
    credentials: { password: hashPassword('correct', { head: 'head', tail: 'tail' }) },
    salty: { head: 'head', tail: 'tail' },
    created_at: 1234567890
  })
  helpers.Database.LoginSession.remove.mockResolvedValue()
  helpers.Database.LoginSession.insert.mockResolvedValue()

  // step 1: GET form/signin
  await request(app).get(`${endpoint.Form.Signin}?a=apptest`)
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/mock_html_page/);
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['signin', { app: {id: 'apptest', url: 'url'} }])

  // step 2: POST session
  await request(app).post(endpoint.Session)
  .set('Accept', 'application/json')
  .send({ email: 'e2e@test.ext', password: 'wrong', app: 'apptest' })
  .expect(401)
  .then( res => {
    expect(res.body).toEqual({})
    expect(res.header).not.toHaveProperty('set-cookie')
  })


})


test('Signin with a not registered account', async() => {

  helpers.Database.App.find.mockImplementation(
    ({id}) => id === 'apptest' || id === 'account' ?
                Promise.resolve({ id: id, url: 'url', realm: 'test', key: 'appkey' })
              :
                Promise.resolve(undefined)
  )
  helpers.form.mockReturnValue('mock_html_page')
  helpers.Database.Account.find.mockResolvedValue(undefined)
  helpers.Database.LoginSession.remove.mockResolvedValue()
  helpers.Database.LoginSession.insert.mockResolvedValue()

  // step 1: GET form/signin
  await request(app).get(`${endpoint.Form.Signin}?a=apptest`)
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/mock_html_page/);
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['signin', { app: {id: 'apptest', url: 'url'} }])


  // step 2: POST session
  await request(app).post(endpoint.Session)
  .set('Accept', 'application/json')
  .send({ email: 'notexist@test.ext', password: 'correct', app: 'apptest' })
  .expect(401)
  .then( res => {
    expect(res.body).toEqual({})
    expect(res.header).not.toHaveProperty('set-cookie')
  })

})

