"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import app from './server/app';
import helpers from './server/helpers';
import request from 'supertest';

import { COOKIE_SESSION, realm } from './server/env';
import { expectUserIsSerialized, expectLoginSession } from './util';

beforeEach( () => jest.clearAllMocks() );
beforeAll( () => {
  process.env.COOKIE_SECRET_KEY = 'test-cookie-enc-secret';
  process.env.PWD_PREFIX = 'head';
  process.env.PWD_SUFFIX = 'tail';
  process.env.DEFAULT_PROFILE_PICTURE = 'profile-picture';
  process.env.EMAIL_SIGN_KEY = 'email-sign-key';
  process.env.EMAIL_EXPIRE_RESET_LINK = '24h';
});
afterAll( () => {
  process.env.COOKIE_SECRET_KEY = undefined;
  process.env.PWD_PREFIX = undefined;
  process.env.PWD_SUFFIX = undefined;
  process.env.DEFAULT_PROFILE_PICTURE = undefined;
  process.env.EMAIL_SIGN_KEY = undefined;
  process.env.EMAIL_EXPIRE_RESET_LINK = undefined;
});


test('POST /user with missing parameters', async () => {
  await request(app).post('/user')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).not.toBeNull();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
  await request(app).post('/user')
                    .send({ user: { uid: 'tester' } })
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).not.toBeNull();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
  await request(app).post('/user')
                    .send({ user: { email: 'tester@team.io' } })
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).not.toBeNull();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
  await request(app).post('/user')
                    .send({ app: 'test', user: { email: 'tester@team.io' } })
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).not.toBeNull();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
  await request(app).post('/user')
                    .send({ user: { email: 'tester@team.io', password: 'secret' } })
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).not.toBeNull();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test('POST /user with invalid app', async () => {
  await request(app).post('/user')
                    .send({ app: 'notapplicable', user: { email: 'tester@team.io', password: 'secret' } })
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).not.toBeNull();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});

test('POST /user with user already exist', async () => {
  await request(app).post('/user')
                    .send({ app: 'test', user: { email: 'tester', password: 'secret' } })
                    .set('Accept', 'application/json')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).not.toBeNull();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});

test('POST /user with error accessing LOGIN Table', async () => {
  await request(app).post('/user')
                    .send({ app: 'test', user: { email: 'error', password: 'secret' } })
                    .set('Accept', 'application/json')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).not.toBeNull();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                      expect(helpers.alert).toHaveBeenCalledTimes(1);
                      expect(helpers.alert.mock.results[0].value).toMatch(/Error in creating new user: checkUserExistance:/);
                    });
});


test('POST /user with error accessing USER Table', async () => {
  await request(app).post('/user')
                    .send({ app: 'test', user: { email: 'error-inserter', password: 'secret' } })
                    .set('Accept', 'application/json')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).not.toBeNull();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                      expect(helpers.alert).toHaveBeenCalledTimes(1);
                      expect(helpers.alert.mock.results[0].value).toMatch(/Error in creating new user: createUser:/);
                    });
});


test('POST /user should send email, call hooks and response 200 after created a new user success', async () => {
  await request(app).post('/user')
                    .send({ app: 'test', user: { email: 'tester@localhost', password: 'secret' } })
                    .set('Accept', 'application/json')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .expect('set-cookie', new RegExp(`${COOKIE_SESSION}_${realm}=.+; Path=/; HttpOnly`))
                    .then( res => {
                      expectSendEmailOK();
                      expectHooksAreCall();
                      expectLoginSession(res.body.session);
                    });

  function expectSendEmailOK() {
    expect(helpers.sendEmail).toHaveBeenCalledTimes(1);
    expect(helpers.sendEmail.mock.calls[0][0]).toMatchObject({
      recipient: [{ address: 'tester@localhost', name: 'tester'}],
      template: 'verifyemail',
    });
  }
  function expectHooksAreCall() {
    expect(helpers.hooks[0]).toHaveBeenCalledTimes(1);
    expect(helpers.hooks[0].mock.calls[0][0]).toHaveProperty('user');
    expectUserIsSerialized(helpers.hooks[0].mock.calls[0][0].user);
    expect(helpers.hooks[0].mock.calls[0][0]).toHaveProperty('token');
  }
});


test('POST /user should alert when failed to send email after created a new user success', async () => {
  await request(app).post('/user')
                    .send({ app: 'test', user: { email: 'error@localhost', password: 'secret' } })
                    .set('Accept', 'application/json')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .expect('set-cookie', new RegExp(`${COOKIE_SESSION}_${realm}=.+; Path=/; HttpOnly`))
                    .then( res => {
                      expect(helpers.sendEmail).toHaveBeenCalled();
                      expect(helpers.alert).toHaveBeenCalled();
                      expect(helpers.alert.mock.results[0].value).toMatch(/User error\[.*\] is created. But failed to send verification email/);
                    });
});


test('POST /user should alert when failed to hook after created a new user success', async () => {
  await request(app).post('/user')
                    .send({ app: 'test', user: { email: 'error@localhost', password: 'secret' } })
                    .set('Accept', 'application/json')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .expect('set-cookie', new RegExp(`${COOKIE_SESSION}_${realm}=.+; Path=/; HttpOnly`))
                    .then( async res => {
                      expect(helpers.hooks[0]).toHaveBeenCalled();
                      await expect(helpers.hooks[0].mock.results[0].value).rejects.toBeFalsy();
                    });
});
