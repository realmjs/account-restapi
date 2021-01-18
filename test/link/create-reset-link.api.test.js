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

const url = '/ln/reset';

test(`[POST ${url}] should response 302 and redirect to /error/400 if missing all parameters`, async () => {
  await request(app).post(url)
                    .expect(302)
                    .expect('Location', '/error/400');
});


test(`[POST ${url}] should response 302 and redirect to /error/400 if missing parameter email`, async () => {
  await request(app).post(url)
                    .send({ app: 'test' })
                    .expect(302)
                    .expect('Location', '/error/400');
});


test(`[POST ${url}] should response 302 and redirect to /error/400 if missing parameter app`, async () => {
  await request(app).post(url)
                    .send({ email: 'tester@localhost.io' })
                    .expect(302)
                    .expect('Location', '/error/400');
});


test(`[POST ${url}] should response 302 and redirect to /error/400 for invalid app`, async () => {
  await request(app).post(url)
                    .send({ app: true, email: 'tester@localhost.io' })
                    .expect(302)
                    .expect('Location', '/error/400');
});


test(`[POST ${url}] should response 302 and redirect to /error/403 if accessing LOGIN Table encounter error`, async () => {
  await request(app).post(url)
                    .send({ app: 'test', email: 'error@localhost.io' })
                    .expect(302)
                    .expect('Location', '/error/403')
                    .then(res => {
                      expect(helpers.alert).toHaveBeenCalled();
                      expect(helpers.alert.mock.results[0].value).toMatch(/POST \/ln\/reset: Error in findUser:/);
                    });
});


test(`[POST ${url}] should response 302 and redirect to /error/403 if username not found`, async () => {
  await request(app).post(url)
                    .send({ app: 'test', email: 'anonymous@localhost.io' })
                    .expect(302)
                    .expect('Location', '/error/403')
                    .then(res => {
                      expect(helpers.alert).not.toHaveBeenCalled();
                    });
});


test(`[POST ${url}] should response 302 and redirect to /error/403 if failed to sendmail`, async () => {
  await request(app).post(url)
                    .send({ app: 'test', email: 'error-sender@localhost.io' })
                    .expect(302)
                    .expect('Location', '/error/403')
                    .then(res => {
                      expect(helpers.alert).toHaveBeenCalled();
                      expect(helpers.alert.mock.results[0].value).toMatch(/POST \/ln\/reset: Error in sendEmail/);
                    });
});