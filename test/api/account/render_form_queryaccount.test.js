"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import request from 'supertest'

import { createCookie } from '../../../src/lib/util'
import { api, app } from '../../testutils/fakeserver'
import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import funcs from '../../../src/api/account/render_form_queryaccount'
const endpoint = '/form/account/query'
api.add(endpoint, { get: funcs })
app.use('/', api.generate());

beforeEach( () => jest.clearAllMocks() )
beforeAll( () => setupEnvironmentVariables() )
afterAll( () => clearEnvironmentVariables() )

const helpers = {
  Database: {
    App: {
      find: jest.fn()
    },
    Account: {
      find: jest.fn()
    }
  },
  form: jest.fn().mockReturnValue('mock_html_page'),
  alert: (msg) => console.log(msg)
}

api.helpers(helpers)


test('Validate request', async () => {
  helpers.form.mockReturnValue('error_400_html_page')

  await
  request(app).get(endpoint)
  .expect(400)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_400_html_page/)
  })

  await
  request(app).get(`${endpoint}?a=app`)
  .expect(400)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_400_html_page/)
  })

  await
  request(app).get(`${endpoint}?u=uid`)
  .expect(400)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_400_html_page/)
  })

})


test('Validate App', async () => {
  helpers.Database.App.find.mockResolvedValueOnce(undefined)
  helpers.form.mockReturnValueOnce('error_403_html_page')

  await
  request(app).get(`${endpoint}?a=app&u=uid`)
  .expect(403)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_403_html_page/)
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['error', { code: 403, reason: 'Permission Denied'}])
})

test('Verify cookie', async () => {

  helpers.Database.App.find.mockResolvedValue({ id: 'app', url: 'url', realm: 'test' })
  helpers.form.mockReturnValue('error_404_html_page')

  await
  request(app).get(`${endpoint}?a=app&u=uid`)
  .expect(403)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_404_html_page/)
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  await
  request(app).get(`${endpoint}?a=app&u=uid`)
  .set('Cookie', [`${process.env.COOKIE_SESSION}_test=invalid_json`])
  .expect(403)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_404_html_page/)
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  await
  request(app).get(`${endpoint}?a=app&u=uid`)
  .set('Cookie', [`${process.env.COOKIE_SESSION}_test="{"uid":"not-encode-cookie"}"`])
  .expect(403)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_404_html_page/)
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  process.env.COOKIE_SECRET_KEY = 'invalid-key' // fake invalid key
  const cookie = createCookie('uid', 'test')
  setupEnvironmentVariables()                   // restore key sothat valid is used when decode cookie
  await
  request(app).get(`${endpoint}?a=app&u=uid`)
  .set('Cookie', [`${cookie[0]}=${cookie[1]}`])
  .expect(403)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_404_html_page/)
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  expect(helpers.form).toHaveBeenCalledTimes(4)
  expect(helpers.form.mock.calls[0]).toEqual(['query_account', { code: 403, reason: 'Permission Denied', app: { id: 'app', url: 'url' } }])
  expect(helpers.form.mock.calls[1]).toEqual(['query_account', { code: 403, reason: 'Permission Denied', app: { id: 'app', url: 'url' }}])
  expect(helpers.form.mock.calls[2]).toEqual(['query_account', { code: 403, reason: 'Permission Denied', app: { id: 'app', url: 'url' }}])
  expect(helpers.form.mock.calls[3]).toEqual(['query_account', { code: 403, reason: 'Permission Denied', app: { id: 'app', url: 'url' }}])

})

test('Reponse html file', async () => {
  helpers.Database.App.find.mockResolvedValue({ id: 'apptest', url: 'url', realm: 'secure', key: 'appkey' })
  helpers.form.mockReturnValue('query_account_200_html_page')
  helpers.Database.Account.find
  .mockResolvedValueOnce({
    uid: 'test',
    email: 'test@test.ext',
    profile: { phone: '098', fullName: 'Awesome' },
    realms: { test: { roles: ['member'] } },
    credentials: { password: 'secret-hashed-string' },
    salty: { head: 'head', tail: 'tail' },
    createdAt: 1234567890
  })

  const cookie = createCookie('uid', 'secure')

  await
  request(app).get(`${endpoint}?a=apptest&u=uid`)
  .set('Cookie', [`${cookie[0]}=${cookie[1]}`])
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/query_account_200_html_page/)
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['query_account', {
    app: { id: 'apptest', url: 'url' },
    account: {
      email: 'test@test.ext',
      profile: { phone: '098', fullName: 'Awesome' },
      createdAt: 1234567890,
    },
  }])

})