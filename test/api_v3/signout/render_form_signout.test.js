"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import request from 'supertest'

import { api, app } from '../../testutils/fakeserver'

import funcs from '../../../src/api_v3/signout/render_form_signout'
const endpoint = '/form/signout'
api.add(endpoint, { get: funcs })
app.use('/', api.generate());

beforeEach(() => jest.clearAllMocks() )

const helpers = {
  database: {
    app: {
      find: jest.fn()
    },
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

  helpers.form.mockClear()

})


test('Validate App and response 403', async () => {

  helpers.database.app.find.mockResolvedValueOnce(undefined)
  helpers.form.mockReturnValueOnce('error_403_html_page')

  await request(app).get(`${endpoint}?app=test`)
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


test('Render signout form using helpers.form and reponse 200', async () => {

  helpers.database.app.find.mockResolvedValueOnce({ url: 'url' })
  helpers.form.mockReturnValueOnce('signout_200_html_page')

  await request(app).get(`${endpoint}?app=test`)
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/signout_200_html_page/);
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['signout', { app: {url: 'url'} }])

  helpers.form.mockClear()
  helpers.database.app.find.mockClear()

})
