"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import { encodeCookie } from '../src/lib/util';
import { COOKIE_SESSION, realm } from './server/env';
import { expectLoginSession } from './util';

import app from './server/app';
import helpers from './server/helpers';
import request from 'supertest';

beforeEach( () => jest.clearAllMocks() );
beforeAll( () => process.env.COOKIE_SECRET_KEY = 'test-cookie-enc-secret' );
afterAll( () => process.env.COOKIE_SECRET_KEY = undefined );

test('[GET /session ]with missing all parameters, should response 400', async () => {
  await request(app).get('/session?r=json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
  await request(app).get('/session?r=json&app=')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });

  await request(app).get('/session')
                    .expect(200)
                    .expect('Content-Type', /text\/html/)
                    .then( res => {
                      expect(res.text).toMatch(/Error 400/);
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
  await request(app).get('/session?app=')
                    .expect(200)
                    .expect('Content-Type', /text\/html/)
                    .then( res => {
                      expect(res.text).toMatch(/Error 400/);
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });

});


test('[GET /session ]with invalid app', async () => {
  await request(app).get('/session?r=json&app=true')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });

  await request(app).get('/session?app=true')
                    .expect(200)
                    .expect('Content-Type', /text\/html/)
                    .then( res => {
                      expect(res.text).toMatch(/Error 400/);
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test('[GET /session ]with no cookie', async () => {
  await request(app).get('/session?r=json&app=test')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.session).toBeNull();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
  await request(app).get('/session?app=test')
                    .expect(200)
                    .expect('Content-Type', /text\/html/)
                    .then( res => {
                      expect(res.text).toMatch(/\"session\":null/);
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });

  await request(app).get('/session?r=json&app=test')
                    .expect(200)
                    .set('Cookie', [`${COOKIE_SESSION}_${realm}={"nouid":true}`])
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.session).toBeNull()
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
  await request(app).get('/session?app=test')
                    .set('Cookie', [`${COOKIE_SESSION}_${realm}={"nouid":true}`])
                    .expect(200)
                    .expect('Content-Type', /text\/html/)
                    .then( res => {
                      expect(res.text).toMatch(/\"session\":null/);
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test('[GET /session ]with invalid cookie', async () => {
  await request(app).get('/session?r=json&app=test')
                    .expect(403)
                    .set('Cookie', [`${COOKIE_SESSION}_${realm}=uid:bare-test`])
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
  await request(app).get('/session?r=json&app=test')
                    .expect(403)
                    .set('Cookie', [`${COOKIE_SESSION}_${realm}="{"uid":"bare-test"}"`])
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });

  await request(app).get('/session?app=test')
                    .expect(200)
                    .set('Cookie', [`${COOKIE_SESSION}_${realm}="{"uid":"bare-test"}"`])
                    .expect('Content-Type', /text\/html/)
                    .then( res => {
                      expect(res.text).toMatch(/Error 403/);
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test('[GET /session ]with invalid users', async () => {
  await request(app).get('/session?r=json&app=test')
                    .expect(404)
                    .set('Cookie', [`${COOKIE_SESSION}_${realm}=${encodeCookie({uid: 'nouser'})}`])
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                    });
  await request(app).get('/session?r=json&app=test')
                    .expect(404)
                    .set('Cookie', [`${COOKIE_SESSION}_${realm}=${encodeCookie({uid: 'norealm'})}`])
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
  await request(app).get('/session?r=json&app=test')
                    .expect(404)
                    .set('Cookie', [`${COOKIE_SESSION}_${realm}=${encodeCookie({uid: 'outsider'})}`])
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });

  await request(app).get('/session?app=test')
                    .expect(200)
                    .set('Cookie', [`${COOKIE_SESSION}_${realm}=${encodeCookie({uid: 'nouser'})}`])
                    .expect('Content-Type', /text\/html/)
                    .then( res => {
                      expect(res.text).toMatch(/Error 404/);
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
  await request(app).get('/session?app=test')
                    .expect(200)
                    .set('Cookie', [`${COOKIE_SESSION}_${realm}=${encodeCookie({uid: 'norealm'})}`])
                    .expect('Content-Type', /text\/html/)
                    .then( res => {
                      expect(res.text).toMatch(/Error 404/);
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
  await request(app).get('/session?app=test')
                    .expect(200)
                    .set('Cookie', [`${COOKIE_SESSION}_${realm}=${encodeCookie({uid: 'outsider'})}`])
                    .expect('Content-Type', /text\/html/)
                    .then( res => {
                      expect(res.text).toMatch(/Error 404/);
                    });
});


test('[GET /session ]with error while accessing USERS table', async () => {
  await request(app).get('/session?r=json&app=test')
                    .expect(403)
                    .set('Cookie', [`${COOKIE_SESSION}_${realm}=${encodeCookie({uid: 'error'})}`])
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(helpers.alert).toHaveBeenCalledTimes(1);
                      expect(helpers.alert.mock.results[0].value).toMatch(/GET \/session: Error in findUser:/);
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });

  await request(app).get('/session?app=test')
                    .expect(200)
                    .set('Cookie', [`${COOKIE_SESSION}_${realm}=${encodeCookie({uid: 'error'})}`])
                    .expect('Content-Type', /text\/html/)
                    .then( res => {
                      expect(res.text).toMatch(/Error 403/);
                      expect(helpers.alert).toHaveBeenCalledTimes(2);
                      expect(helpers.alert.mock.results[1].value).toMatch(/GET \/session: Error in findUser:/);
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});

test('[GET /session ]responses success', async () => {
  await request(app).get('/session?r=json&app=test')
                    .expect(200)
                    .set('Cookie', [`${COOKIE_SESSION}_${realm}=${encodeCookie({uid: 'tester'})}`])
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expectLoginSession(res.body.session);
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });

  await request(app).get('/session?app=test')
                    .expect(200)
                    .set('Cookie', [`${COOKIE_SESSION}_${realm}=${encodeCookie({uid: 'tester'})}`])
                    .expect('Content-Type', /text\/html/)
                    .then( res => {
                      expect(res.text).toMatch(/{\"user\":{\"username\":\"tester\".*},\"token\":\".*\",\"sid\":/);
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});
