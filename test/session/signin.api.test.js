"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import app from '../server/app';
import helpers from '../server/helpers';
import request from 'supertest';

import { COOKIE_SESSION, realm } from '../server/env';
import { expectLoginSession } from '../util';

beforeEach( () => jest.clearAllMocks() );
beforeAll( () => {
  process.env.COOKIE_SECRET_KEY = 'test-cookie-enc-secret';
  process.env.PWD_PREFIX = 'head';
  process.env.PWD_SUFFIX = 'tail';
});
afterAll( () => {
  process.env.COOKIE_SECRET_KEY = undefined;
  process.env.PWD_PREFIX = undefined;
  process.env.PWD_SUFFIX = undefined;
});


test('[POST /session] with missing all parameters, should response 400', async () => {
  await request(app).post('/session')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test('[POST /session] with missing parameter password and app, should response 400', async () => {
  await request(app).post('/session')
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


test('[POST /session] with missing parameter app, should response 400', async () => {
  await request(app).post('/session')
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


test('[POST /session] with empty password, should response 400', async () => {
  await request(app).post('/session')
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


test('[POST /session] with invalid app, should response 400', async () => {
  await request(app).post('/session')
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


test('[POST /session] with not registered user, should response 400', async () => {
  await request(app).post('/session')
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

test('[POST /session] with user has no realm, should response 400', async () => {
  await request(app).post('/session')
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


test('[POST /session] with user from other realm, should response 400', async () => {
  await request(app).post('/session')
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

test('[POST /session] with error accessing LOGIN Table, should response 403', async () => {
  await request(app).post('/session')
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

test('[POST /session] with incorrect password, should response 401', async () => {
  await request(app).post('/session')
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

test('[POST /session] with correct password should response success (200)', async () => {
  await request(app).post('/session')
                    .send({username: 'tester', password: 'secret-pwd', app: 'test'})
                    .set('Accept', 'application/json')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .expect('set-cookie', new RegExp(`${COOKIE_SESSION}_${realm}=.+; Path=/; HttpOnly`))
                    .then( res => {
                      expectLoginSession(res.body.session);
                    });
});
