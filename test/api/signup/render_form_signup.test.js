"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import request from 'supertest'

import { api, app } from '../../testutils/fakeserver'

import funcs from '../../../src/api/signup/render_form_signup'
const endpoint = '/form/signup'
api.add(endpoint, { get: funcs })
app.use('/', api.generate());

beforeEach(
  () => jest.clearAllMocks()
);

const helpers = {
  Database: {
    App: {
      find: jest.fn()
    },
  },
  form: jest.fn().mockReturnValue('mock_html_page')
}

api.helpers(helpers)


test('Validate Request parameter', async () => {

  helpers.form.mockReturnValueOnce('error_400_html_page')

  await request(app).get(endpoint)
  .expect(400)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_400_html_page/);
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['error', { code: 400, reason: 'Bad Request'}])

  helpers.form.mockClear()

})


test('Response 403 if validating app failed', async () => {

  helpers.Database.App.find.mockResolvedValueOnce(undefined)
  helpers.form.mockReturnValueOnce('error_403_html_page')

  await request(app).get(`${endpoint}?a=apptest`)
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


test('Response signup form returned by helpers.form', async () => {

  helpers.Database.App.find.mockResolvedValueOnce({ id: 'apptest', url: 'url', realm: 'test', key: 'appkey' })
  helpers.form.mockReturnValueOnce('mock_html_page')

  await request(app).get(`${endpoint}?a=apptest`)
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/mock_html_page/);
  })

  expect(helpers.form).toHaveBeenCalled()
  expect(helpers.form.mock.calls[0]).toEqual(['signup', { app: { id: 'apptest', url: 'url' } }])

  helpers.form.mockClear()
  helpers.Database.App.find.mockClear()

})
