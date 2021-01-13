"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import app from './server/app';
import request from 'supertest';

import { encodeCookie } from '../src/lib/util';
import { COOKIE_SESSION, realm } from "./server/env";

beforeAll( () => process.env.COOKIE_SECRET_KEY = 'test-cookie-enc-secret' );
afterAll( () => process.env.COOKIE_SECRET_KEY = undefined );


test('DELETE /session with invalid params' , async () => {
  await request(app).delete('/session')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).not.toBeNull());
  await request(app).delete('/session')
                    .send({app: 'notapplicable'})
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).not.toBeNull());
});


test('DELETE /session without cookie' , async () => {
  await request(app).delete('/session')
                    .send({app: 'test', sid: 'any'})
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).not.toBeNull());
});


test('DELETE /session invalid cookie session' , async () => {
  const cookie = encodeCookie({uid: 'tester'});
  const sid = JSON.parse(cookie).sessionId;
  await request(app).delete('/session')
                    .send({app: 'test', sid: 'ivalid'})
                    .set('Cookie', [`${COOKIE_SESSION}_${realm}=${cookie}`])
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).not.toBeNull());
});


test('DELETE /session should response success' , async () => {
  const cookie = encodeCookie({uid: 'tester'});
  const sid = JSON.parse(cookie).sessionId;
  await request(app).delete('/session')
                    .send({app: 'test', sid: sid})
                    .set('Cookie', [`${COOKIE_SESSION}_${realm}=${cookie}`])
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .expect('set-cookie', new RegExp(`${COOKIE_SESSION}_${realm}=; Path=/`));
});

