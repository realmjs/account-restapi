'use strict'

import 'core-js/stable';
import 'regenerator-runtime/runtime';

import { app } from '../../testutils/fakeserver'
import api from '../../../src/api_v3/index'

const helpers = {
  database: {
    app: {
      find: jest.fn()
    },
    account: {
      find: jest.fn(),
      insert: jest.fn()
    },
  },
  hook: {
    sendEmail: jest.fn(),
    onCreatedUser: jest.fn()
  },
  form: jest.fn()
}

api.helpers(helpers)

app.use('/', api.generate());

import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import request from 'supertest'

beforeEach( () => jest.clearAllMocks() )
beforeAll( () => setupEnvironmentVariables() )
afterAll( () => clearEnvironmentVariables() )


test('Signup a new account', async() => {

  helpers.database.app.find.mockImplementation(
    ({id}) => id === 'apptest' || id === 'account' ?
                Promise.resolve({ id: id, url: 'url', realm: 'test', key: 'appkey' })
              :
                Promise.resolve(undefined)
  )
  helpers.form.mockReturnValue('mock_html_page')
  helpers.database.account.find.mockResolvedValue(undefined)
  helpers.database.account.insert.mockResolvedValue(undefined)
  helpers.hook.sendEmail.mockResolvedValue(undefined)
  helpers.hook.onCreatedUser.mockResolvedValue(undefined)

  // step 1: GET form/signup/email
  await request(app).get('/form/signup/email?a=apptest')
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch('mock_html_page');
  })

  expect(helpers.form).toHaveBeenCalled()
  expect(helpers.form.mock.calls[0]).toEqual(['signup', { app: expect.any(String) }])

  let apptest = helpers.form.mock.calls[0][1].app

  // step 2: POST link/signup
  await request(app).post('/link/signup')
  .set('Accept', 'application/json')
  .send({ email: 'e2e@test.ext', app: apptest })
  .expect(200)

  expect(helpers.hook.sendEmail).toHaveBeenCalled()
  expect(helpers.hook.sendEmail.mock.calls[0]).toEqual([{
    to: { address: 'e2e@test.ext' },
    template: 'create_new_account',
    data: { link: expect.any(String) },
  }])

  const email = /e=(.*)&a/.exec(helpers.hook.sendEmail.mock.calls[0][0].data.link)[1]
  expect(email).toEqual('e2e@test.ext')

  apptest = /&a=(.*)&t/.exec(helpers.hook.sendEmail.mock.calls[0][0].data.link)[1]
  expect(apptest).toEqual('apptest')

  const token = /^.*&t=(.*)/.exec(helpers.hook.sendEmail.mock.calls[0][0].data.link)[1]

  // step 3: GET form/account/new
  await request(app).get(`/form/account/new?e=${email}&a=${apptest}&t=${token}`)
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch(/mock_html_page/);
  })

  expect(helpers.form).toHaveBeenCalledTimes(2)
  expect(helpers.form.mock.calls[1]).toEqual(['newaccount', { email: email, app: { id: 'apptest', url: 'url', realm: 'test', key: 'appkey' } }])

  // step 3: POST account
  await request(app).post('/account')
  .set('Accept', 'application/json')
  .send({ email: email, password: 'secret', profile: { phone: '098', fullName: 'Awesome' }, app: apptest })
  .expect(200)
  .expect('set-cookie', new RegExp(`${process.env.COOKIE_SESSION}_test=.+; Path=/; HttpOnly`))
  .then( res =>
    expect(res.body).toEqual({
      user: {
        email: email,
        profile: { phone: '098', fullName: 'Awesome' },
        createdAt: expect.any(Number),
      },
      token: expect.any(String),
      sid: expect.any(String),
    })
  )

})


test('Signup with a registered email', async() => {

  helpers.database.app.find.mockImplementation(
    ({id}) => id === 'apptest' || id === 'account' ? Promise.resolve({ url: 'url', realm: 'test', key: 'appkey' }) : Promise.resolve(undefined)
  )
  helpers.form.mockReturnValue('mock_html_page')
  helpers.database.account.find.mockImplementation(
    ({email}) => email === 'registered@test.ext' ? Promise.resolve({ uid: 'uid' }) : Promise.resolve(undefined)
  )
  helpers.hook.sendEmail.mockResolvedValue(undefined)

  // step 1: GET form/signup/email
  await request(app).get('/form/signup/email?a=apptest')
  .expect(200)
  .expect('Content-Type', /text\/html/)
  .then(res => {
    expect(res.text).toMatch('mock_html_page');
  })

  expect(helpers.form).toHaveBeenCalled()
  expect(helpers.form.mock.calls[0]).toEqual(['signup', { app: expect.any(String) }])

  let apptest = helpers.form.mock.calls[0][1].app

  // step 2: POST link/signup
  await request(app).post('/link/signup')
  .set('Accept', 'application/json')
  .send({ email: 'registered@test.ext', app: apptest })
  .expect(409)

  expect(helpers.hook.sendEmail).not.toHaveBeenCalled()

})

