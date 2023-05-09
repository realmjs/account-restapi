"use strict"

import "core-js/stable"
import "regenerator-runtime/runtime"

import request from 'supertest'

import { api, app } from '../../testutils/fakeserver'

import funcs from '../../../src/api_v3/resetpassword/render_form_newpassword'
const endpoint = '/form/account/newpassword'
api.add(endpoint, { get: funcs })
app.use('/', api.generate());

beforeEach( () => jest.clearAllMocks() )

const helpers = {
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

  await request(app).get(`${endpoint}?a=app`)
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


test('Reponse 200 with reset password form', async () => {

  helpers.form.mockReturnValue('200_html_page')

  await request(app).get(`${endpoint}?a=app&t=token`)
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/200_html_page/);
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['newpassword', { token: 'token', app: 'app' } ])

  helpers.form.mockClear()

})

