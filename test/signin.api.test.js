"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import app from './server/app';
import helpers from './server/helpers';
import request from 'supertest';

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

test('POST /session with missing parameters', async () => {
  await request(app).post('/session')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).not.toBeNull());
  await request(app).post('/session')
                    .send({username: 'tester'})
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).not.toBeNull());
  await request(app).post('/session')
                    .send({username: 'tester', password: 'secret-pwd'})
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).not.toBeNull());
});

test('POST /session with invalid app', async () => {
  await request(app).post('/session')
                    .send({username: 'tester', password: 'secret-pwd', app: 'notapplicable'})
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).not.toBeNull());
});


test('POST /session with not registered user', async () => {
  await request(app).post('/session')
                    .send({username: 'anoy', password: 'secret-pwd', app: 'test'})
                    .set('Accept', 'application/json')
                    .expect(404)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).not.toBeNull());
  await request(app).post('/session')
                    .send({username: 'norealm', password: 'secret-pwd', app: 'test'})
                    .set('Accept', 'application/json')
                    .expect(404)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).not.toBeNull());
  await request(app).post('/session')
                    .send({username: 'outsider', password: 'secret-pwd', app: 'test'})
                    .set('Accept', 'application/json')
                    .expect(404)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).not.toBeNull());
});

test('POST /session with error accessing LOGIN Table', async () => {
  await request(app).post('/session')
                    .send({username: 'error', password: 'secret-pwd', app: 'test'})
                    .set('Accept', 'application/json')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).not.toBeNull();
                      expect(helpers.alert).toHaveBeenCalledTimes(1);
                      expect(helpers.alert.mock.results[0].value).toMatch(/Error in creating new session: findUser:/);
                    });
});

test('POST /session with incorrect password', async () => {
  await request(app).post('/session')
                    .send({username: 'tester', password: 'incorrect-pwd', app: 'test'})
                    .set('Accept', 'application/json')
                    .expect(401)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).not.toBeNull());
});

test('POST /session with correct password should response success', async () => {
  await request(app).post('/session')
                    .send({username: 'tester', password: 'secret-pwd', app: 'test'})
                    .set('Accept', 'application/json')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.session).toHaveProperty('user');
                      expect(res.body.session.user).not.toHaveProperty('uid');
                      expect(res.body.session.user).not.toHaveProperty('credentials');
                      expect(res.body.session.user).not.toHaveProperty('realms');
                      expect(res.body.session).toHaveProperty('token');
                    });
});