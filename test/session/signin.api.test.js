"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import app from '../server/app';
import helpers from '../server/helpers';
import request from 'supertest';

import { COOKIE_SESSION, realm } from '../server/env';
import { expectLoginSession, setupEnvironmentVariables, clearEnvironmentVariables } from '../util';

beforeEach( () => jest.clearAllMocks() );
beforeAll( () => setupEnvironmentVariables() );
afterAll( () => clearEnvironmentVariables() );

const url = '/session';

test(`[POST ${url}] should response 400 if missing all parameters`, async () => {
  await request(app).post(url)
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[POST ${url}] should response 400 if missing parameters password and app`, async () => {
  await request(app).post(url)
                    .send({username: 'tester'})
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[POST ${url}] should response 400 if missing parameter app`, async () => {
  await request(app).post(url)
                    .send({username: 'tester', password: 'secret-pwd'})
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[POST ${url}] should response 400 for empty password`, async () => {
  await request(app).post(url)
                    .send({username: 'tester', password: '', app: 'test'})
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[POST ${url}] should response 400 for invalid app`, async () => {
  await request(app).post(url)
                    .send({username: 'tester', password: 'secret-pwd', app: 'notapplicable'})
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[POST ${url}] should response 404 if user has not registered`, async () => {
  await request(app).post(url)
                    .send({username: 'anoy', password: 'secret-pwd', app: 'test'})
                    .set('Accept', 'application/json')
                    .expect(404)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});

test(`[POST ${url}] should response 404 if user has no realm`, async () => {
  await request(app).post(url)
                    .send({username: 'norealm', password: 'secret-pwd', app: 'test'})
                    .set('Accept', 'application/json')
                    .expect(404)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[POST ${url}] should response 404 if user has not joined realm`, async () => {
  await request(app).post(url)
                    .send({username: 'outsider', password: 'secret-pwd', app: 'test'})
                    .set('Accept', 'application/json')
                    .expect(404)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});

test(`[POST ${url}] should response 403 and alert if accessing LOGIN Table encounter an error`, async () => {
  await request(app).post(url)
                    .send({username: 'error', password: 'secret-pwd', app: 'test'})
                    .set('Accept', 'application/json')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                      expect(helpers.alert).toHaveBeenCalledTimes(1);
                      expect(helpers.alert.mock.results[0].value).toMatch(/POST \/session: Error in findUser:/);
                    });
});

test(`[POST ${url}] should response 401 if password mismatch`, async () => {
  await request(app).post(url)
                    .send({username: 'tester', password: 'incorrect-pwd', app: 'test'})
                    .set('Accept', 'application/json')
                    .expect(401)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});

test(`[POST ${url}] should response 200 if login with correct credential`, async () => {
  await request(app).post(url)
                    .send({username: 'tester', password: 'secret-pwd', app: 'test'})
                    .set('Accept', 'application/json')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .expect('set-cookie', new RegExp(`${COOKIE_SESSION}_${realm}=.+; Path=/; HttpOnly`))
                    .then( res => {
                      expectLoginSession(res.body.session);
                    });
});
