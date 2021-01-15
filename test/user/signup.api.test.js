"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import app from '../server/app';
import helpers from '../server/helpers';
import request from 'supertest';

import { COOKIE_SESSION, realm } from '../server/env';
import { expectUserIsSerialized, expectLoginSession, setupEnvironmentVariables, clearEnvironmentVariables } from '../util';

beforeEach( () => jest.clearAllMocks() );
beforeAll( () => setupEnvironmentVariables() );
afterAll( () => clearEnvironmentVariables() );

const url = '/user';

test(`[POST ${url}] should response 400 if missing all parameters`, async () => {
  await request(app).post(url)
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[POST ${url}] should response 400 missing all parameters except user.uid`, async () => {
  await request(app).post(url)
                    .send({ user: { uid: 'tester' } })
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});

test(`[POST ${url}] should response 400 missing all parameters except user.email`, async () => {
  await request(app).post(url)
                    .send({ user: { email: 'tester@team.io' } })
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[POST ${url}] should response 400 if missing parameter user.password`, async () => {
  await request(app).post(url)
                    .send({ app: 'test', user: { email: 'tester@team.io' } })
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});

test(`[POST ${url}] should response 400 if missing parameter app`, async () => {
  await request(app).post(url)
                    .send({ user: { email: 'tester@team.io', password: 'secret' } })
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});


test(`[POST ${url}] should response 400 for invalid app`, async () => {
  await request(app).post(url)
                    .send({ app: 'notapplicable', user: { email: 'tester@team.io', password: 'secret' } })
                    .set('Accept', 'application/json')
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});

test(`[POST ${url}] should response 403 if user has registerred already`, async () => {
  await request(app).post(url)
                    .send({ app: 'test', user: { email: 'tester', password: 'secret' } })
                    .set('Accept', 'application/json')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                    });
});

test(`[POST ${url}] should response 403 and alert if accessing LOGIN Table encounter an error`, async () => {
  await request(app).post(url)
                    .send({ app: 'test', user: { email: 'error', password: 'secret' } })
                    .set('Accept', 'application/json')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                      expect(helpers.alert).toHaveBeenCalledTimes(1);
                      expect(helpers.alert.mock.results[0].value).toMatch(/POST \/user: Error in checkUserExistance:/);
                    });
});


test(`[POST ${url}] should response 403 and alert if accessing USER Table encounter an error`, async () => {
  await request(app).post(url)
                    .send({ app: 'test', user: { email: 'error-inserter', password: 'secret' } })
                    .set('Accept', 'application/json')
                    .expect(403)
                    .expect('Content-Type', /json/)
                    .then( res => {
                      expect(res.body.error).toBeDefined();
                      expect(res.body.session).toBeUndefined();
                      expect(res.headers['set-cookie']).toBeUndefined();
                      expect(helpers.alert).toHaveBeenCalledTimes(1);
                      expect(helpers.alert.mock.results[0].value).toMatch(/POST \/user: Error in createUser:/);
                    });
});


test(`[POST ${url}] should response 200, send email and call hooks after created a new user success`, async () => {
  await request(app).post(url)
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


test(`[POST ${url}] should response 200 and alert when failed to send email after created a new user success`, async () => {
  await request(app).post(url)
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


test(`[POST ${url}] should response 200 and alert when failed to hook after created a new user success`, async () => {
  await request(app).post(url)
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
