"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import request from 'supertest'
import jwt from 'jsonwebtoken'

import { api, app } from '../../testutils/fakeserver'

import funcs from '../../../src/api/signout/render_form_signout'
const endpoint = '/form/signout'
api.add(endpoint, { get: funcs })
app.use('/', api.generate());

beforeEach(() => jest.clearAllMocks() )

const helpers = {
  Database: {
    App: {
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

  await request(app).get(`${endpoint}?a=apptest`)
  .expect(400)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/error_400_html_page/);
  })

  helpers.form.mockClear()

})


test('Validate App and response 403', async () => {

  helpers.Database.App.find.mockResolvedValueOnce(undefined)
  helpers.form.mockReturnValueOnce('error_403_html_page')

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


test('Validate Token and response 403', async () => {

  helpers.Database.App.find.mockResolvedValueOnce({ id: 'apptest', url: 'url', realm: 'test', key: 'appkey' })
  helpers.form.mockReturnValueOnce('error_403_html_page')

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


test('Render signout form using helpers.form and reponse 200', async () => {

  helpers.Database.App.find.mockResolvedValueOnce({ id: 'apptest', url: 'url', realm: 'test', key: 'appkey' })
  helpers.form.mockReturnValueOnce('signout_200_html_page')

  const token = jwt.sign({uid: 'uid', sid: 'sid'}, 'appkey')
  await request(app).get(`${endpoint}?a=apptest&t=${token}`)
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/signout_200_html_page/);
  })

  expect(helpers.form).toHaveBeenCalledTimes(1)
  expect(helpers.form.mock.calls[0]).toEqual(['signout', { app: {id: 'apptest', url: 'url'}, sid: 'sid' }])

  helpers.form.mockClear()
  helpers.Database.App.find.mockClear()

})
