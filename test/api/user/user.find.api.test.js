"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import app from '../../server/app';
import helpers from '../../server/helpers';
import request from 'supertest';

import { createSessionToken } from '../../../src/lib/util';

beforeEach( () => jest.clearAllMocks() );

const url = '/user';

test(`[Get ${url}] should response 400 if missing all parameters`, async () => {
  await request(app).get(url)
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[Get ${url}] should response 400 if missing parameter u`, async () => {
  await request(app).get(`${url}?app=test`)
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[Get ${url}] should response 400 if missing parameter app`, async () => {
  await request(app).get(`${url}?u=tester`)
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[Get ${url}] should response 400 for invalid app`, async () => {
  await request(app).get(`${url}?app=true`)
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[Get ${url}] should response 401 if decoded uid failed (query by token) `, async () => {
  await request(app).get(`${url}?app=test&u=bare-tester`)
                    .expect(401)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[Get ${url}] should response 403 and alert if accessing USER Table encounter an error (query by token)`, async () => {
  const user = { uid: 'error', realms: { test: {roles: ['member']} } };
  const userToken = createSessionToken(user, helpers.Apps.find(a => a.id === 'test'));
  await request(app).get(`${url}?app=test&u=${userToken}`)
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                      expect(helpers.alert).toHaveBeenCalled();
                      expect(helpers.alert.mock.results[0].value).toMatch(/GET \/user: Error in findUserByToken:/);
                    });
});


test(`[Get ${url}] should response 404 if user not found (query by token)`, async () => {
  const user = { uid: 'anonymous', realms: { test: {roles: ['member']} } };
  const userToken = createSessionToken(user, helpers.Apps.find(a => a.id === 'test'));
  await request(app).get(`${url}?app=test&u=${userToken}`)
                    .expect(404)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[Get ${url}] should response 200 if user found (query by token)`, async () => {
  const user = { uid: 'tester', realms: { test: {roles: ['member']} } };
  const userToken = createSessionToken(user, helpers.Apps.find(a => a.id === 'test'));
  await request(app).get(`${url}?app=test&u=${userToken}`)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body).toHaveProperty('username');
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[Get ${url}] should response 403 and alert if accessing LOGIN Table encounter an error (query by email)`, async () => {
  await request(app).get(`${url}?app=test&u=error@localhost.io`)
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                      expect(helpers.alert).toHaveBeenCalled();
                      expect(helpers.alert.mock.results[0].value).toMatch(/GET \/user: Error in findUserByEmail:/);
                    });
});


test(`[Get ${url}] should response 404 if user not found (query by email)`, async () => {
  await request(app).get(`${url}?app=test&u=anonymous@localhost.io`)
                    .expect(404)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[Get ${url}] should response 200 if user found  (query by email)`, async () => {
  await request(app).get(`${url}?app=test&u=tester@localhost.io`)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body).toHaveProperty('username');
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});
