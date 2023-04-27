"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import request from 'supertest'

import { api, app } from '../../testutils/fakeserver'

import funcs from '../../../src/api_v3/signup/render_form_signup'
const endpoint = '/form/signup'
api.add(endpoint, { get: funcs })
app.use('/', api.generate());

beforeEach(
  () => jest.clearAllMocks()
);

const helpers = {
  form: jest.fn().mockReturnValue('mock_html_page')
}

api.helpers(helpers)

test('Response signup form returned by helpers.form', async () => {

  await request(app).get(endpoint)
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/mock_html_page/);
  })

  expect(helpers.form).toHaveBeenCalled()
  expect(helpers.form.mock.calls[0]).toEqual(['signup'])

})
