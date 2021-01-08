"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import api from '../src/api';

const helpers = {
  Apps: [{ id: 'test', url: 'localhost', realm: 'test', key: 'test-key' }],
  alert: jest.fn(msg => msg),
};

api.helpers(helpers);

import express from 'express';
import request from 'supertest';

const app = express();
app.use('/', api.generate());

beforeEach(() => jest.clearAllMocks() );

describe('test sso api', () => {

  test('sso with missing parameters', async () => {
    await request(app).get('/session?r=json')
                      .expect(400)
                      .expect('Content-Type', /json/);
    await request(app).get('/session?r=json&app=')
                      .expect(400)
                      .expect('Content-Type', /json/);
    await request(app).get('/session')
                      .expect(200)
                      .expect('Content-Type', /text\/html/)
                      .then( res => expect(res.text).toMatch(/Error 400/) );
    await request(app).get('/session?app=')
                      .expect(200)
                      .expect('Content-Type', /text\/html/)
                      .then( res => expect(res.text).toMatch(/Error 400/) );

  });

  test('sso with invalid app', async () => {
    await request(app).get('/session?r=json&app=true')
                      .expect(400)
                      .expect('Content-Type', /json/);
    await request(app).get('/session?app=true')
                      .expect(200)
                      .expect('Content-Type', /text\/html/)
                      .then( res => expect(res.text).toMatch(/Error 400/) );

  });

});


