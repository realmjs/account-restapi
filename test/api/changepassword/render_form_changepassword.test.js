"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import request from 'supertest'

import { api, app } from '../../testutils/fakeserver'
import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import funcs from '../../../src/api/changepassword/render_form_changepassword'
const endpoint = '/form/account/changepassword'
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

  await request(app).get(`${endpoint}?a=apptest`)
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

  expect(helpers.form).toHaveBeenCalledTimes(3)
  expect(helpers.form.mock.calls[0]).toEqual(['error', { code: 400, reason: 'Bad query params'}])
  expect(helpers.form.mock.calls[1]).toEqual(['error', { code: 400, reason: 'Bad query params'}])
  expect(helpers.form.mock.calls[2]).toEqual(['error', { code: 400, reason: 'Bad query params'}])

  helpers.form.mockClear()

})


test('Verify app and response 403', async () => {

  helpers.form.mockReturnValue('error_403_html_page')
  helpers.Database.App.find.mockResolvedValueOnce(undefined)

  await request(app).get(`${endpoint}?a=apptest&t=token`)
  .expect(403)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_403_html_page/);
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['error', { code: 403, reason: 'Permission Denied'}])

  helpers.form.mockClear()
  helpers.Database.App.find.mockClear()

})


test('Render from and response 200', async () => {

  helpers.form.mockReturnValue('200_html_page')
  helpers.Database.App.find.mockResolvedValueOnce({ id: 'apptest', url: 'url', realm: 'test', key: 'appkey' })

  await request(app).get(`${endpoint}?a=apptest&t=token`)
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/200_html_page/);
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['changepassword', { app: {id: 'apptest', url: 'url'}, token: 'token' }])

  helpers.form.mockClear()
  helpers.Database.App.find.mockClear()

})

