"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import jwt from 'jsonwebtoken';

import app from './server/app';
import helpers from './server/helpers';
import request from 'supertest';
import { delay } from "./util";


beforeEach( () => jest.clearAllMocks() );
beforeAll( () => {
  process.env.EMAIL_SIGN_KEY = 'email-sign-key';
});
afterAll( () => {
  process.env.EMAIL_SIGN_KEY = undefined;
});

test('[PUT /user/password] with missing all parameters', async () => {
  await request(app).put('/user/password')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test('[PUT /user/password] with missing parameter t (token)', async () => {
  await request(app).put('/user/password')
                    .send({ password: 'secret'})
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test('[PUT /user/password] with invalid token', async () => {
  await request(app).put('/user/password')
                    .send({ password: 'secret', t: 'invalid' })
                    .set('Accept', 'application/json')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});

test('[PUT /user/password] with expired token', async () => {
  const token = jwt.sign({uid:'error-updater'}, process.env.EMAIL_SIGN_KEY, { expiresIn: '1s' });
  await delay(2000);
  await request(app).put('/user/password')
                    .send({ password: 'secret', t: token })
                    .set('Accept', 'application/json')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test('[PUT /user/password] should alert when encounter database error', async () => {
  await request(app).put('/user/password')
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

test('[PUT /user/password] response 200 if success', async () => {
  await request(app).put('/user/password')
                    .send({ password: 'secret', t: jwt.sign({uid:'tester'}, process.env.EMAIL_SIGN_KEY) })
                    .set('Accept', 'application/json')
                    .expect(200)
                    .expect('Content-Type', /json/);
});
