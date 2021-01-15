"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import jwt from 'jsonwebtoken';

import app from '../server/app';
import helpers from '../server/helpers';
import request from 'supertest';
import { delay, setupEnvironmentVariables, clearEnvironmentVariables } from "../util";


beforeEach( () => jest.clearAllMocks() );
beforeAll( () => setupEnvironmentVariables() );
afterAll( () => clearEnvironmentVariables() );

const url = '/user/password';

test(`[PUT ${url}] should response 400 if missing all parameters`, async () => {
  await request(app).put(url)
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[PUT ${url}] should response 400 if missing parameter t (token)`, async () => {
  await request(app).put(url)
                    .send({ password: 'secret'})
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[PUT ${url}] should response 403 for invalid token`, async () => {
  await request(app).put(url)
                    .send({ password: 'secret', t: 'invalid' })
                    .set('Accept', 'application/json')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});

test(`[PUT ${url}] should response 403 for expired token`, async () => {
  const token = jwt.sign({uid:'error-updater'}, process.env.EMAIL_SIGN_KEY, { expiresIn: '1s' });
  await delay(2000);
  await request(app).put(url)
                    .send({ password: 'secret', t: token })
                    .set('Accept', 'application/json')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[PUT ${url}] should response 400 and alert when accessing USER Table encounter an error`, async () => {
  await request(app).put(url)
                    .send({ password: 'secret', t: jwt.sign({uid:'error-updater'}, process.env.EMAIL_SIGN_KEY) })
                    .set('Accept', 'application/json')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                      expect(helpers.alert).toHaveBeenCalled();
                      expect(helpers.alert.mock.results[0].value).toMatch(/PUT \/user\/password: Error in updatePassword:/);
                    });
});

test(`[PUT ${url}] should response 200 if request with all valid parameters`, async () => {
  await request(app).put(url)
                    .send({ password: 'secret', t: jwt.sign({uid:'tester'}, process.env.EMAIL_SIGN_KEY) })
                    .set('Accept', 'application/json')
                    .expect(200)
                    .expect('Content-Type', /json/);
});
