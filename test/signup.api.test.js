"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import app from './server/app';
import helpers from './server/helpers';
import request from 'supertest';

beforeEach( () => jest.clearAllMocks() );

test('POST /session with missing parameters', async () => {
  await request(app).post('/session')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).not.toBeNull());
  await request(app).post('/session')
                    .send({username: 'tester'})
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).not.toBeNull());
  await request(app).post('/session')
                    .send({username: 'tester', password: 'secret-pwd'})
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).not.toBeNull());
});

test('POST /session with invalid app', async () => {
  await request(app).post('/session')
                    .send({username: 'tester', password: 'secret-pwd', app: 'notapplicable'})
                    .set('Accept', 'application/json')
                    .expect(404)
                    .expect('Content-Type', /json/)
                    .then( res => expect(res.body.error).not.toBeNull());
});
