"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import request from 'supertest'

import { createCookie } from '../../../src/lib/util'
import { api, app } from '../../testutils/fakeserver'
import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import funcs from '../../../src/api/sso/render_form_sso'
const endpoint = '/session/sso'
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
  form: jest.fn().mockReturnValue('mock_html_page')
}

api.helpers(helpers)


test('Validate request and response 400', async () => {

  helpers.form.mockReturnValue('error_400_html_page')

  await request(app).get(endpoint)
  .expect(400)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_400_html_page/)
  })

  helpers.form.mockClear()

})


test('Validate App and response 403', async () => {

  helpers.Database.App.find.mockResolvedValueOnce(undefined)
  helpers.form.mockReturnValueOnce('error_403_html_page')

  await request(app).get(`${endpoint}?a=app`)
  .expect(403)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_403_html_page/)
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['error', { code: 403, reason: 'Permission Denied'}])

  helpers.form.mockClear()
  helpers.Database.App.find.mockClear()

})


test('Verify cookie and response 404 for bad cookie', async () => {

  helpers.Database.App.find.mockResolvedValue({ id: 'app', url: 'url', realm: 'test' })
  helpers.form.mockReturnValue('error_404_html_page')

  await request(app).get(`${endpoint}?a=app`)
  .expect(404)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_404_html_page/)
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  await request(app).get(`${endpoint}?a=app`)
  .set('Cookie', [`${process.env.COOKIE_SESSION}_test=invalid_json`])
  .expect(404)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_404_html_page/)
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  await request(app).get(`${endpoint}?a=app`)
  .set('Cookie', [`${process.env.COOKIE_SESSION}_test="{"uid":"not-encode-cookie"}"`])
  .expect(404)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_404_html_page/)
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  process.env.COOKIE_SECRET_KEY = 'invalid-key' // fake invalid key
  const cookie = createCookie('uid', 'test')
  setupEnvironmentVariables()                   // restore key sothat valid is used when decode cookie
  await request(app).get(`${endpoint}?a=app`)
  .set('Cookie', [`${cookie[0]}=${cookie[1]}`])
  .expect(404)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_404_html_page/)
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  expect(helpers.form).toHaveBeenCalledTimes(4)
  expect(helpers.form.mock.calls[0]).toEqual(['sso', { code: 404, reason: 'No or Bad Cookie', app: { id: 'app', url: 'url' } }])
  expect(helpers.form.mock.calls[1]).toEqual(['sso', { code: 404, reason: 'No or Bad Cookie', app: { id: 'app', url: 'url' }}])
  expect(helpers.form.mock.calls[2]).toEqual(['sso', { code: 404, reason: 'No or Bad Cookie', app: { id: 'app', url: 'url' }}])
  expect(helpers.form.mock.calls[3]).toEqual(['sso', { code: 404, reason: 'No or Bad Cookie', app: { id: 'app', url: 'url' }}])

  helpers.form.mockClear()
  helpers.Database.App.find.mockClear()

})


test('Verify account and response 404 for invalid user', async () => {

  helpers.Database.App.find.mockResolvedValue({ id: 'app', url: 'url', realm: 'test' })
  helpers.form.mockReturnValue('error_404_html_page')
  helpers.Database.Account.find.mockResolvedValue(undefined)

  const cookie = createCookie('uid', 'test')
  await request(app).get(`${endpoint}?a=app`)
  .set('Cookie', [`${cookie[0]}=${cookie[1]}`])
  .expect(404)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_404_html_page/)
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['sso', { code: 404, reason: 'No account', app: { id: 'app', url: 'url' }}])

  expect(helpers.Database.Account.find).toHaveBeenCalledTimes(1)
  expect(helpers.Database.Account.find.mock.calls[0]).toEqual([{ uid: 'uid'}])

  helpers.form.mockClear()
  helpers.Database.App.find.mockClear()
  helpers.Database.Account.find.mockClear()

})


import jwt from 'jsonwebtoken'
test('Reponse signin session for valid request', async () => {

  helpers.Database.App.find.mockResolvedValue({ id: 'apptest', url: 'url', realm: 'test', key: 'appkey' })
  helpers.form.mockReturnValue('sso_200_html_page')
  helpers.Database.Account.find.mockResolvedValue({
    uid: 'uid',
    email: 'email@test.ext',
    profile: { phone: '098', fullname: 'Awesome' },
    realms: { test: { roles: ['member'] } },
    credentials: { password: 'secret-hashed-string' },
    salty: { head: 'head', tail: 'tail' },
    created_at: 1234567890
  })

  const cookie = createCookie('uid', 'test')
  await request(app).get(`${endpoint}?a=apptest`)
  .set('Cookie', [`${cookie[0]}=${cookie[1]}`])
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/sso_200_html_page/)
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['sso', {
    user: {
      email: 'email@test.ext',
      profile: { phone: '098', fullname: 'Awesome' },
      created_at: 1234567890,
    },
    token: jwt.sign({uid: 'uid', roles: ['member']}, 'appkey'),
    sid: JSON.parse(cookie[1]).sessionId,
    app: { id: 'apptest', url: 'url' }
  }])

  helpers.form.mockClear()
  helpers.Database.App.find.mockClear()
  helpers.Database.Account.find.mockClear()

})