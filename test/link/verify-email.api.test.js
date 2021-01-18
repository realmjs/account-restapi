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

const url = '/ln/verify';

test(`[GET ${url}] should response 302 and redirect to /error/400 if missing all parameters`, async () => {
  await request(app).get(url)
                    .expect(302)
                    .expect('Location', '/error/400');
});


test(`[GET ${url}] should response 302 and redirect to /error/400 if missing email`, async () => {
  await request(app).get(`${url}?t=token`)
                    .expect(302)
                    .expect('Location', '/error/400');
});


test(`[GET ${url}] should response 302 and redirect to /error/400 if missing token`, async () => {
  await request(app).get(`${url}?email=tester@localhost.io`)
                    .expect(302)
                    .expect('Location', '/error/400');
});


test(`[GET ${url}] should response 302 and redirect to /error/403 for invalid token`, async () => {
  await request(app).get(`${url}?email=tester@localhost.io&t=invalid.token`)
                    .expect(302)
                    .expect('Location', '/error/403');
});


test(`[GET ${url}] should response 302 and redirect to /error/403 for expired token`, async () => {
  const token = jwt.sign({uid:'tester'}, process.env.EMAIL_SIGN_KEY, { expiresIn: '1s' });
  await delay(2000);
  await request(app).get(`${url}?email=tester@localhost.io&t=${token}`)
                    .expect(302)
                    .expect('Location', '/error/403');
});


test(`[GET ${url}] should response 302 and redirect to /error/403 when accessing USER Table encounter an error`, async () => {
  const token = jwt.sign({uid:'error'}, process.env.EMAIL_SIGN_KEY);
  await request(app).get(`${url}?email=tester@localhost.io&t=${token}`)
                    .expect(302)
                    .expect('Location', '/error/403')
                    .then(res => {
                      expect(helpers.alert).toHaveBeenCalled();
                      expect(helpers.alert.mock.results[0].value).toMatch(/GET \/ln\/email: Error in checkVerifiedEmail:/);
                    });
});


test(`[GET ${url}] should response 302 and redirect to /error/403 if email not match with user`, async () => {
  const token = jwt.sign({uid:'error-updater'}, process.env.EMAIL_SIGN_KEY);
  await request(app).get(`${url}?email=tester@localhost.io&t=${token}`)
                    .expect(302)
                    .expect('Location', '/error/403')
                    .then(res => {
                      expect(helpers.alert).not.toHaveBeenCalled();
                    });
});


test(`[GET ${url}] should response 302 and redirect to /error/403 if user does not exist`, async () => {
  const token = jwt.sign({uid:'anonymous'}, process.env.EMAIL_SIGN_KEY);
  await request(app).get(`${url}?email=anonymous@localhost.io&t=${token}`)
                    .expect(302)
                    .expect('Location', '/error/403')
                    .then(res => {
                      expect(helpers.alert).not.toHaveBeenCalled();
                    });
});


test(`[GET ${url}] should response 302 and redirect to /ln/mailverified if user has been verified`, async () => {
  const token = jwt.sign({uid:'verifiedtester'}, process.env.EMAIL_SIGN_KEY);
  await request(app).get(`${url}?email=verifiedtester@localhost.io&t=${token}`)
                    .expect(302)
                    .expect('Location', `/ln/mailverified?t=${token}`)
                    .then(res => {
                      expect(helpers.alert).not.toHaveBeenCalled();
                    });
});


test(`[GET ${url}] should response 302 and redirect to /error/403 when updating USER Table encounter an error`, async () => {
  const token = jwt.sign({uid:'error-updater'}, process.env.EMAIL_SIGN_KEY);
  await request(app).get(`${url}?email=error-updater@localhost.io&t=${token}`)
                    .expect(302)
                    .expect('Location', '/error/403')
                    .then(res => {
                      expect(helpers.alert).toHaveBeenCalled();
                      expect(helpers.alert.mock.results[0].value).toMatch(/GET \/ln\/email: Error in setEmailVerified:/);
                    });
});


test(`[GET ${url}] should response 302 and redirect to /ln/mailverified after updated USER Table success`, async () => {
  const token = jwt.sign({uid:'tester'}, process.env.EMAIL_SIGN_KEY);
  await request(app).get(`${url}?email=tester@localhost.io&t=${token}`)
                    .expect(302)
                    .expect('Location', `/ln/mailverified?t=${token}`)
                    .then(res => {
                      expect(helpers.alert).not.toHaveBeenCalled();
                      expect(helpers.Database.USER.update).toHaveBeenCalled();
                    });
});
