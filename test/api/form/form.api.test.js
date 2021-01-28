
import "core-js/stable";
import "regenerator-runtime/runtime";

import jwt from 'jsonwebtoken';

import app from '../../server/app';
import request from 'supertest';
import { setupEnvironmentVariables, clearEnvironmentVariables } from "../../util";


beforeEach( () => jest.clearAllMocks() );
beforeAll( () => setupEnvironmentVariables() );
afterAll( () => clearEnvironmentVariables() );

const url = '/form';

test(`[GET ${url}] should response error page (400) if missing all parameters`, async () => {
  await request(app).get(url)
                    .expect(200)
                    .expect('Content-Type', /text\/html/)
                    .then(res => {
                      expect(res.text).toMatch(/ __data={\"route\":\"error\",.*\"code\":400/);
                    });
});


test(`[GET ${url}] should response error page (400) if missing name in parameters`, async () => {
  await request(app).get(`${url}?app=test`)
                    .expect(200)
                    .expect('Content-Type', /text\/html/)
                    .then(res => {
                      expect(res.text).toMatch(/ __data={\"route\":\"error\",.*\"code\":400/);
                    });
});


test(`[GET ${url}] should response error page (400) if missing app in parameters`, async () => {
  await request(app).get(`${url}?name=signin`)
                    .expect(200)
                    .expect('Content-Type', /text\/html/)
                    .then(res => {
                      expect(res.text).toMatch(/ __data={\"route\":\"error\",.*\"code\":400/);
                    });
});


test(`[GET ${url}] should response error page (400) for invalid app`, async () => {
  await request(app).get(`${url}?app=true&name=signin`)
                    .expect(200)
                    .expect('Content-Type', /text\/html/)
                    .then(res => {
                      expect(res.text).toMatch(/ __data={\"route\":\"error\",.*\"code\":400/);
                    });
});


test(`[GET ${url}] should response error page (400) if requesting signout form without sid`, async () => {
  await request(app).get(`${url}?app=test&&name=signout`)
                    .expect(200)
                    .expect('Content-Type', /text\/html/)
                    .then(res => {
                      expect(res.text).toMatch(/ __data={\"route\":\"error\",.*\"code\":400/);
                    });
});


test(`[GET ${url}] should response error page (400) if request resetpassword form without token`, async () => {
  await request(app).get(`${url}?app=test&name=reset`)
                    .expect(200)
                    .expect('Content-Type', /text\/html/)
                    .then(res => {
                      expect(res.text).toMatch(/ __data={\"route\":\"error\",.*\"code\":400/);
                    });
});


test(`[GET ${url}] should response error page (400) if request resetpassword form with invalid token`, async () => {
  await request(app).get(`${url}?app=test&name=reset&t=invalid`)
                    .expect(200)
                    .expect('Content-Type', /text\/html/)
                    .then(res => {
                      expect(res.text).toMatch(/ __data={\"route\":\"error\",.*\"code\":400/);
                    });
});


test(`[GET ${url}] should response 200 and return resetpassword page if request resetpassword form with valid token`, async () => {
  const token = jwt.sign({uid:'tester'}, process.env.EMAIL_SIGN_KEY);
  await request(app).get(`${url}?app=test&name=resetpassword&t=${token}`)
                    .expect(200)
                    .expect('Content-Type', /text\/html/)
                    .then(res => {
                      expect(res.text).toMatch(/ __data={\"route\":\"resetpassword\",/);
                    });
});


test(`[GET ${url}] should response 200 and return signin page if request signin form`, async () => {
  const token = jwt.sign({uid:'tester'}, process.env.EMAIL_SIGN_KEY);
  await request(app).get(`${url}?app=test&name=signin`)
                    .expect(200)
                    .expect('Content-Type', /text\/html/)
                    .then(res => {
                      expect(res.text).toMatch(/ __data={\"route\":\"signin\",/);
                    });
});