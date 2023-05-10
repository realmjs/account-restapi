"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import request from 'supertest'

import { createCookie } from '../../../src/lib/util'
import { api, app } from '../../testutils/fakeserver'
import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import funcs from '../../../src/api_v3/sso/render_form_sso'
const endpoint = '/session/sso'
api.add(endpoint, { get: funcs })
app.use('/', api.generate());

beforeEach( () => jest.clearAllMocks() )
beforeAll( () => setupEnvironmentVariables() )
afterAll( () => clearEnvironmentVariables() )

const helpers = {
  database: {
    app: {
      find: jest.fn()
    },
    account: {
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

  helpers.database.app.find.mockResolvedValueOnce(undefined)
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
  helpers.database.app.find.mockClear()

})


test('Verify cookie and response 400 for bad cookie', async () => {

  helpers.database.app.find.mockResolvedValue({ realm: 'test' })
  helpers.form.mockReturnValue('error_400_html_page')

  await request(app).get(`${endpoint}?a=app`)
  .expect(400)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_400_html_page/)
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  await request(app).get(`${endpoint}?a=app`)
  .set('Cookie', [`${process.env.COOKIE_SESSION}_test=invalid_json`])
  .expect(400)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_400_html_page/)
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  await request(app).get(`${endpoint}?a=app`)
  .set('Cookie', [`${process.env.COOKIE_SESSION}_test="{"uid":"not-encode-cookie"}"`])
  .expect(400)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_400_html_page/)
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  process.env.COOKIE_SECRET_KEY = 'invalid-key' // fake invalid key
  const cookie = createCookie('uid', 'test')
  setupEnvironmentVariables()                   // restore key sothat valid is used when decode cookie
  await request(app).get(`${endpoint}?a=app`)
  .set('Cookie', [`${cookie[0]}=${cookie[1]}`])
  .expect(400)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_400_html_page/)
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  expect(helpers.form).toHaveBeenCalledTimes(4)
  expect(helpers.form.mock.calls[0]).toEqual(['error', { code: 400, reason: 'Bad Cookie'}])
  expect(helpers.form.mock.calls[1]).toEqual(['error', { code: 400, reason: 'Bad Cookie'}])
  expect(helpers.form.mock.calls[2]).toEqual(['error', { code: 400, reason: 'Bad Cookie'}])
  expect(helpers.form.mock.calls[3]).toEqual(['error', { code: 400, reason: 'Bad Cookie'}])

  helpers.form.mockClear()
  helpers.database.app.find.mockClear()

})


test('Verify account and response 404 for invalid user', async () => {

  helpers.database.app.find.mockResolvedValue({ realm: 'test' })
  helpers.form.mockReturnValue('error_404_html_page')
  helpers.database.account.find.mockResolvedValue(undefined)

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
  expect(helpers.form.mock.calls[0]).toEqual(['error', { code: 404, reason: 'No account'}])

  expect(helpers.database.account.find).toHaveBeenCalledTimes(1)
  expect(helpers.database.account.find.mock.calls[0]).toEqual([{ uid: 'uid'}])

  helpers.form.mockClear()
  helpers.database.app.find.mockClear()
  helpers.database.account.find.mockClear()

})


import jwt from 'jsonwebtoken'
test('Reponse signin session for valid request', async () => {

  helpers.database.app.find.mockResolvedValue({ realm: 'test', key: 'key' })
  helpers.form.mockReturnValue('sso_200_html_page')
  helpers.database.account.find.mockResolvedValue({
    uid: 'uid',
    email: 'email@test.ext',
    profile: { phone: '098', fullName: 'Awesome' },
    realms: { test: { roles: ['member'] } },
    credentials: { password: 'secret-hashed-string' },
    salty: { head: 'head', tail: 'tail' },
    createdAt: 1234567890
  })

  const cookie = createCookie('uid', 'test')
  await request(app).get(`${endpoint}?a=app`)
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
      profile: { phone: '098', fullName: 'Awesome' },
      createdAt: 1234567890,
    },
    token: jwt.sign({uid: 'uid', roles: ['member']}, 'key'),
    sid: JSON.parse(cookie[1]).sessionId,
  }])

  helpers.form.mockClear()
  helpers.database.app.find.mockClear()
  helpers.database.account.find.mockClear()

})