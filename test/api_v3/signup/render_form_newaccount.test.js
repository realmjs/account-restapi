"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import jwt from 'jsonwebtoken';
import { hashEmail } from '../../../src/lib/util';

import request from 'supertest'

import { api, app } from '../../testutils/fakeserver'
import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import funcs from '../../../src/api_v3/signup/render_form_newaccount'
const endpoint = '/form/account/new'
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
  form: jest.fn()
}

api.helpers(helpers)

test('Validate request and response 400', async () => {

  helpers.form.mockReturnValue('error_400_html_page')

  await request(app).get(endpoint)
  .expect(400)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_400_html_page/);
  })

  await request(app).get(`${endpoint}?e=email`)
  .expect(400)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_400_html_page/);
  })

  await request(app).get(`${endpoint}?t=token`)
  .expect(400)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_400_html_page/);
  })

  await request(app).get(`${endpoint}?e=email&t=token`)
  .expect(400)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_400_html_page/);
  })

  expect(helpers.form).toHaveBeenCalledTimes(4)
  expect(helpers.form.mock.calls[0]).toEqual(['error', { code: 400, reason: 'Bad query params'}])
  expect(helpers.form.mock.calls[1]).toEqual(['error', { code: 400, reason: 'Bad query params'}])
  expect(helpers.form.mock.calls[2]).toEqual(['error', { code: 400, reason: 'Bad query params'}])
  expect(helpers.form.mock.calls[3]).toEqual(['error', { code: 400, reason: 'Bad query params'}])

  helpers.form.mockClear()

})


test('Verify token and reponses 400 if decode failed', async () => {

  helpers.form.mockReturnValue('error_400_html_page')

  const email = 'email@test.ext'

  const token = jwt.sign({ email }, 'Fake')

  await request(app).get(`${endpoint}?e=${email}&a=app&t=${token}`)
  .expect(400)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_400_html_page/);
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['error', { code: 400, reason: 'Bad Signature'}])

  helpers.form.mockClear()

})


test('Verify email and reponses 400 if not match with decoded from token', async () => {

  helpers.form.mockReturnValue('error_400_html_page')

  const email = 'email@test.ext'

  const token = jwt.sign({ email }, process.env.EMAIL_VALLIDATION_SIGN_KEY)

  await request(app).get(`${endpoint}?e=${email}&a=app&t=${token}`)
  .expect(400)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_400_html_page/);
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['error', { code: 400, reason: 'Invalid Email'}])

  helpers.form.mockClear()

})


test('Validate App and response 403', async () => {

  helpers.database.app.find.mockResolvedValueOnce(undefined)
  helpers.form.mockReturnValueOnce('error_403_html_page')

  const email = hashEmail('email@test.ext')

  const token = jwt.sign({ email }, process.env.EMAIL_VALLIDATION_SIGN_KEY)

  await request(app).get(`${endpoint}?e=email@test.ext&a=invalid&t=${token}`)
  .expect(403)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_403_html_page/);
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['error', { code: 403, reason: 'Permission Denied'}])

  helpers.form.mockClear()
  helpers.database.app.find.mockClear()

})


test('Verify email and reponses 409 if already exists in database', async () => {

  helpers.form.mockReturnValue('error_409_html_page')
  helpers.database.account.find.mockResolvedValue({ email: 'email@test.ext'})
  helpers.database.app.find.mockResolvedValueOnce({ url: 'url' })

  const email = hashEmail('email@test.ext')

  const token = jwt.sign({ email }, process.env.EMAIL_VALLIDATION_SIGN_KEY)

  await request(app).get(`${endpoint}?e=email@test.ext&a=app&t=${token}`)
  .expect(409)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_409_html_page/);
  })

  expect(helpers.database.account.find).toHaveBeenCalledTimes(1)
  expect(helpers.database.account.find.mock.calls[0]).toEqual([{ email: 'email@test.ext' }])
  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['error', { code: 409, reason: 'Registered Email'}])

  helpers.form.mockClear()
  helpers.database.account.find.mockClear()
  helpers.database.app.find.mockClear()

})


test('Reponses 200 with newaccount form return from helpers.form ', async () => {

  helpers.form.mockReturnValue('200_new_account_html_page')
  helpers.database.account.find.mockResolvedValue(undefined)
  helpers.database.app.find.mockResolvedValueOnce({ url: 'url' })

  const email = hashEmail('email@test.ext')

  const token = jwt.sign({ email }, process.env.EMAIL_VALLIDATION_SIGN_KEY)

  await request(app).get(`${endpoint}?e=email@test.ext&a=app&t=${token}`)
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/200_new_account_html_page/);
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['newaccount', { email: 'email@test.ext', app: { url: 'url' } }])

  helpers.form.mockClear()
  helpers.database.account.find.mockClear()
  helpers.database.app.find.mockClear()

})
