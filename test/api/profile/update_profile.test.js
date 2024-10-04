'use strict'

import 'core-js/stable';
import 'regenerator-runtime/runtime';

import request from 'supertest'
import jwt from 'jsonwebtoken'

import { api, app } from '../../testutils/fakeserver'
import { setupEnvironmentVariables, clearEnvironmentVariables } from '../../testutils/fakeenv'

import funcs from '../../../src/api/profile/update_profile'
const endpoint = '/me/profile'
api.add(endpoint, { put: funcs })
app.use('/', api.generate());

const helpers = {
  Database: {
    App: {
      find: jest.fn(),
    },
    Account: {
      Profile: { update: jest.fn() },
    }
  }
}

api.helpers(helpers)

beforeEach( () => jest.clearAllMocks() )
beforeAll( () => setupEnvironmentVariables() )
afterAll( () => clearEnvironmentVariables() )

test('Validate Request', async () => {
  await request(app).put('/me/profile').expect(400);
  await request(app).put('/me/profile?a=app').send({}).expect(400);
  await request(app).put('/me/profile').send({fullname: 'name'}).expect(400);
});

test('Authenticate Request', async () => {

  helpers.Database.App.find.mockResolvedValue({ id: 'app', key: 'appkey' });

  const token = 'faketoken';
  await
  request(app).put('/me/profile?a=app')
  .set('Authorization', `Bearer ${token}`)
  .send({ fullname: '<NAME>' })
  .expect(401);

});

test('Update Profile', async () => {
  helpers.Database.App.find.mockResolvedValue({ id: 'app', key: 'appkey' });
  const token = jwt.sign({ uid: 'uid' }, 'appkey');
  await request(app).put('/me/profile?a=app')
  .set('Authorization', `Bearer ${token}`)
  .send({ fullname: '<NAME>' })
  .expect(200);

  expect(helpers.Database.Account.Profile.update).toHaveBeenCalledWith('uid', { fullname: '<NAME>' });

});