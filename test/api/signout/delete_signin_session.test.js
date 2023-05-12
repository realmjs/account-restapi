"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import request from 'supertest'

import { createCookie } from '../../../src/lib/util'
import { api, app } from '../../testutils/fakeserver'
import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import funcs from '../../../src/api/signout/delete_signin_session'
const endpoint = '/session'
api.add(endpoint, { delete: funcs })
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
    },
  },
}

api.helpers(helpers)


test('Validate request and response 400', async () => {

  await request(app).delete(endpoint)
  .expect(400)

  await request(app).delete(endpoint)
  .set('Accept', 'application/json')
  .send({ app: 'app' })
  .expect(400)

  await request(app).delete(endpoint)
  .set('Accept', 'application/json')
  .send({ sid: 'sid' })
  .expect(400)

})


test('Validate app and response 403', async () => {

  helpers.database.app.find.mockResolvedValueOnce(undefined)

  await request(app).delete(endpoint)
  .set('Accept', 'application/json')
  .send({ app: 'invalid', sid: 'sid' })
  .expect(403)

  expect(helpers.database.app.find).toHaveBeenCalledTimes(1)
  expect(helpers.database.app.find.mock.calls[0]).toEqual([{id: 'invalid'}])

  helpers.database.app.find.mockClear()

})


test('Verify cookie and response 400 for bad cookie', async () => {

  helpers.database.app.find.mockResolvedValue({ realm: 'test', key: 'key' })

  await request(app).delete(endpoint)
  .set('Accept', 'application/json')
  .send({ app: 'app', sid: 'sid' })
  .expect(400)
  .then(res => {
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  await request(app).delete(endpoint)
  .set('Cookie', [`${process.env.COOKIE_SESSION}_test=invalid_json`])
  .set('Accept', 'application/json')
  .send({ app: 'app', sid: 'sid' })
  .expect(400)
  .then(res => {
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  await request(app).delete(endpoint)
  .set('Cookie', [`${process.env.COOKIE_SESSION}_test="{"uid":"not-encode-cookie"}"`])
  .set('Accept', 'application/json')
  .send({ app: 'app', sid: 'sid' })
  .expect(400)
  .then(res => {
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  process.env.COOKIE_SECRET_KEY = 'invalid-key' // fake invalid key
  const cookie = createCookie('uid', 'test')
  setupEnvironmentVariables()                   // restore key sothat valid is used when decode cookie
  await request(app).delete(endpoint)
  .set('Cookie', [`${cookie[0]}=${cookie[1]}`])
  .set('Accept', 'application/json')
  .send({ app: 'app', sid: 'sid' })
  .expect(400)
  .then(res => {
    expect(res.headers['set-cookie']).toBeUndefined()
  })


  helpers.database.app.find.mockClear()

})


test('Verify cookie session id and response 400', async () => {

  helpers.database.app.find.mockResolvedValue({ realm: 'test', key: 'key' })

  const cookie = createCookie('uid', 'test')
  await request(app).delete(endpoint)
  .set('Cookie', [`${cookie[0]}=${cookie[1]}`])
  .set('Accept', 'application/json')
  .send({ app: 'app', sid: 'sid' })
  .expect(400)
  .then(res => {
    expect(res.headers['set-cookie']).toBeUndefined()
  })

})

test('Clear cookie for valid request', async () => {

  helpers.database.app.find.mockResolvedValue({ realm: 'test', key: 'key' })

  const cookie = createCookie('uid', 'test')
  await request(app).delete(endpoint)
  .set('Cookie', [`${cookie[0]}=${cookie[1]}`])
  .set('Accept', 'application/json')
  .send({ app: 'app', sid: JSON.parse(cookie[1]).sessionId })
  .expect(200)
  .expect('set-cookie', new RegExp(`${process.env.COOKIE_SESSION}_test=; Path=/`));

})
