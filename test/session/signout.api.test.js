"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import app from '../server/app';
import request from 'supertest';

import { encodeCookie } from '../../src/lib/util';
import { COOKIE_SESSION, realm } from "../server/env";

import { setupEnvironmentVariables, clearEnvironmentVariables } from '../util';
beforeAll( () => setupEnvironmentVariables() );
afterAll( () => clearEnvironmentVariables() );

const url = '/session';

test(`[DELETE ${url}] should response 400 if missing all parameters` , async () => {
  await request(app).delete(url)
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).toBeDefined());
});


test(`[DELETE ${url}] should response 400 if missing parameter sid` , async () => {
  await request(app).delete(url)
                    .send({app: 'notapplicable'})
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).toBeDefined());
});


test(`[DELETE ${url}] should response 400 if missing parameter app` , async () => {
  await request(app).delete(url)
                    .send({sid: 'any'})
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).toBeDefined());
});


test(`[DELETE ${url}] should response 400 for invalid app` , async () => {
  await request(app).delete(url)
                    .send({app: 'notapplicable', sid: 'any'})
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).toBeDefined());
});


test(`[DELETE ${url}] should response 403 if request without a cookie` , async () => {
  await request(app).delete(url)
                    .send({app: 'test', sid: 'any'})
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).toBeDefined());
});


test(`[DELETE ${url}] should response 403 if request with invalid cookie session` , async () => {
  const cookie = encodeCookie({uid: 'tester'});
  const sid = JSON.parse(cookie).sessionId;
  await request(app).delete(url)
                    .send({app: 'test', sid: 'ivalid'})
                    .set('Cookie', [`${COOKIE_SESSION}_${realm}=${cookie}`])
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).toBeDefined());
});


test(`[DELETE ${url}] should response 200 if request with a valid cookie session` , async () => {
  const cookie = encodeCookie({uid: 'tester'});
  const sid = JSON.parse(cookie).sessionId;
  await request(app).delete(url)
                    .send({app: 'test', sid: sid})
                    .set('Cookie', [`${COOKIE_SESSION}_${realm}=${cookie}`])
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .expect('set-cookie', new RegExp(`${COOKIE_SESSION}_${realm}=; Path=/`));
});

