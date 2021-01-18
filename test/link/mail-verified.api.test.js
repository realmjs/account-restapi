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

const url = '/ln/mailverified';


test(`[GET ${url}] should response 302 and redirect to /error/400 if missing token in query parameters`, async () => {
  await request(app).get(url)
                    .expect(302)
                    .expect('Location', '/error/400');
});


test(`[GET ${url}] should response 302 and redirect to /error/403 for invalid token`, async () => {
  await request(app).get(`${url}?t=invalid.token`)
                    .expect(302)
                    .expect('Location', '/error/403');
});


test(`[GET ${url}] should response 302 and redirect to /error/403 for expired token`, async () => {
  const token = jwt.sign({uid:'tester'}, process.env.EMAIL_SIGN_KEY, { expiresIn: '1s' });
  await delay(2000);
  await request(app).get(`${url}?t=${token}`)
                    .expect(302)
                    .expect('Location', '/error/403');
});


test(`[GET ${url}] should response 200 and reponse with html page`, async () => {
  const token = jwt.sign({uid:'tester'}, process.env.EMAIL_SIGN_KEY);
  await request(app).get(`${url}?t=${token}`)
                    .expect(200)
                    .expect('Content-Type', /text\/html/)
                    .then( res => {
                      expect(res.text).toMatch(/Email Verified/);
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});

