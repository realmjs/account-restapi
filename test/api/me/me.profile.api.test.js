"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import app from '../../server/app';
import helpers from '../../server/helpers';
import request from 'supertest';

import { createSessionToken } from '../../../src/lib/util';

import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../util';

beforeEach( () => jest.clearAllMocks() );

beforeAll( () => setupEnvironmentVariables() );
afterAll( () => clearEnvironmentVariables() );

const url = '/me/profile';

test(`[PUT ${url}] should response 400 if missing all parameters`, async () => {
  await request(app).put(url)
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[PUT ${url}] should response 400 if missing parameter app`, async () => {
  await request(app).put(url)
                    .send({ token: true, profile: 'profile' })
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[PUT ${url}] should response 400 if missing parameter token`, async () => {
  await request(app).put(url)
                    .send({ app: true, profile: 'profile' })
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[PUT ${url}] should response 400 if missing parameter profile`, async () => {
  await request(app).put(url)
                    .send({ app: true, token: true })
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[PUT ${url}] should response 400 for invalid app`, async () => {
  const user = { uid: 'tester', realms: { test: {roles: ['member']} } };
  const userToken = createSessionToken(user, helpers.Apps.find(a => a.id === 'test'));
  await request(app).put(url)
                    .send({ app: true, token: userToken, profile: 'profile' })
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[PUT ${url}] should response 401 if request with invalid token`, async () => {
  await request(app).put(url)
                    .send({ app: 'test', token: 'invalid', profile: 'profile' })
                    .set('Accept', 'application/json')
                    .expect(401)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[PUT ${url}] should response 403 and alert if accessing USER Table encounter an error`, async () => {
  const user = { uid: 'error-updater', realms: { test: {roles: ['member']} } };
  const userToken = createSessionToken(user, helpers.Apps.find(a => a.id === 'test'));
  await request(app).put(url)
                    .send({ app: 'test', token: userToken, profile: 'profile' })
                    .set('Accept', 'application/json')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                      expect(helpers.alert).toHaveBeenCalled();
                      expect(helpers.alert.mock.results[0].value).toMatch(/PUT \/me\/profile: Error in update:/);
                    });
});


test(`[PUT ${url}] should response 200 if all parameters are valid`, async () => {
  const user = { uid: 'tester', realms: { test: {roles: ['member']} } };
  const userToken = createSessionToken(user, helpers.Apps.find(a => a.id === 'test'));
  await request(app).put(url)
                    .send({ app: 'test', token: userToken, profile: 'profile' })
                    .set('Accept', 'application/json')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).not.toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                      expect(helpers.alert).not.toHaveBeenCalled();
                    });
});
