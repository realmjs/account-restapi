"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import app from '../server/app';
import helpers from '../server/helpers';
import request from 'supertest';

import { createSessionToken } from '../../src/lib/util';

beforeEach( () => jest.clearAllMocks() );


test('[Get /user] with missing all parameters, should response 400', async () => {
  await request(app).get('/user')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test('[Get /user] with missing parameter u, should response 400', async () => {
  await request(app).get('/user?app=test')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test('[Get /user] with missing parameter app, should response 400', async () => {
  await request(app).get('/user?u=tester')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test('[Get /user] with invalid parameter app, should response 400', async () => {
  await request(app).get('/user?app=true')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test('[Get /user] query by uid should response 401 if decode uid failed', async () => {
  await request(app).get(`/user?app=test&u=bare-tester`)
                    .expect(401)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test('[Get /user] query by uid should alert and response 403 if access database failed', async () => {
  const user = { uid: 'error', realms: { test: {roles: ['member']} } };
  const userToken = createSessionToken(user, helpers.Apps.find(a => a.id === 'test'));
  await request(app).get(`/user?app=test&u=${userToken}`)
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                      expect(helpers.alert).toHaveBeenCalled();
                      expect(helpers.alert.mock.results[0].value).toMatch(/GET \/user: Error in findUser:/);
                    });
});


test('[Get /user] query by uid should response 404 if user not found', async () => {
  const user = { uid: 'anonymous', realms: { test: {roles: ['member']} } };
  const userToken = createSessionToken(user, helpers.Apps.find(a => a.id === 'test'));
  await request(app).get(`/user?app=test&u=${userToken}`)
                    .expect(404)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test('[Get /user] query by uid should response 200 if user found', async () => {
  const user = { uid: 'tester', realms: { test: {roles: ['member']} } };
  const userToken = createSessionToken(user, helpers.Apps.find(a => a.id === 'test'));
  await request(app).get(`/user?app=test&u=${userToken}`)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body).toHaveProperty('username');
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test('[Get /user] query by email should alert and response 403 if access database failed', async () => {
  await request(app).get(`/user?app=test&u=error@localhost.io`)
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                      expect(helpers.alert).toHaveBeenCalled();
                      expect(helpers.alert.mock.results[0].value).toMatch(/GET \/user: Error in findUser:/);
                    });
});


test('[Get /user] query by email should response 404 if user not found', async () => {
  await request(app).get(`/user?app=test&u=anonymous@localhost.io`)
                    .expect(404)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test('[Get /user] query by email should response 200 if user found', async () => {
  await request(app).get(`/user?app=test&u=tester@localhost.io`)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body).toHaveProperty('username');
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});
