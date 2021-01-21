"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import app from '../../server/app';
import helpers from '../../server/helpers';
import request from 'supertest';

const url = '/me/password';

beforeEach( () => jest.clearAllMocks() );

import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../util';
beforeAll( () => setupEnvironmentVariables() );
afterAll( () => clearEnvironmentVariables() );


test(`[PUT ${url}] should response 400 when missing all parameters`, async () => {
  await request(app).put(url)
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[PUT ${url}] should response 400 when missing parameters username and password`, async () => {
  await request(app).put(url)
                    .send({ app: 'test', newPassword: 'new-secret' })
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[PUT ${url}] should response 400 when missing parameter app`, async () => {
  await request(app).put(url)
                    .send({ username: 'tester@localhost.io', password: 'secret', newPassword: 'new-secret'})
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});

test(`[PUT ${url}] should response 400 when parameter password is empty`, async () => {
  await request(app).put(url)
                    .send({ app: 'test', username: 'tester@localhost.io', password: '', newPassword: 'new-secret'})
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[PUT ${url}] should response 400 when parameter password is true (trick by hacker)`, async () => {
  await request(app).put(url)
                    .send({ app: 'test', username: 'tester@localhost.io', password: true, newPassword: 'new-secret'})
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});

test(`[PUT ${url}] should response 400 if parameter app is invalid`, async () => {
  await request(app).put(url)
                    .send({ app: true, username: 'tester@localhost.io', password: '', newPassword: 'new-secret'})
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[PUT ${url}] should response 403 and call alert when accessing database encounters error`, async () => {
  await request(app).put(url)
                    .send({ app: 'test', username: 'error@localhost.io', password: 'secret-pwd', newPassword: 'new-secret'})
                    .set('Accept', 'application/json')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                      expect(helpers.alert).toHaveBeenCalled();
                      expect(helpers.alert.mock.results[0].value).toMatch(/PUT \/me\/password: Error in findUser:/);
                    });
});


test(`[PUT ${url}] should response 403 when have not found user`, async () => {
  await request(app).put(url)
                    .send({ app: 'test', username: 'anoy@localhost.io', password: 'secret-pwd', newPassword: 'new-secret'})
                    .set('Accept', 'application/json')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                      expect(helpers.alert).not.toHaveBeenCalled();
                    });
});


test(`[PUT ${url}] should response 403 when password mismatch`, async () => {
  await request(app).put(url)
                    .send({ app: 'test', username: 'tester@localhost.io', password: 'incorrect', newPassword: 'new-secret'})
                    .set('Accept', 'application/json')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                      expect(helpers.alert).not.toHaveBeenCalled();
                    });
});


test(`[PUT ${url}] should response 403 and call alert when updating database encounters error`, async () => {
  await request(app).put(url)
                    .send({ app: 'test', username: 'error-updater@localhost.io', password: 'secret-pwd', newPassword: 'new-secret'})
                    .set('Accept', 'application/json')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                      expect(helpers.alert).toHaveBeenCalled();
                      expect(helpers.alert.mock.results[0].value).toMatch(/PUT \/me\/password: Error in updatePassword:/);
                    });
});


test(`[PUT ${url}] should response 200`, async () => {
  await request(app).put(url)
                    .send({ app: 'test', username: 'tester@localhost.io', password: 'secret-pwd', newPassword: 'new-secret'})
                    .set('Accept', 'application/json')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).not.toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});
