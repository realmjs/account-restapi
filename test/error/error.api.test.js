import "core-js/stable";
import "regenerator-runtime/runtime";

import app from '../server/app';
import request from 'supertest';
import { setupEnvironmentVariables, clearEnvironmentVariables } from "../util";


beforeEach( () => jest.clearAllMocks() );
beforeAll( () => setupEnvironmentVariables() );
afterAll( () => clearEnvironmentVariables() );

const url = '/error';

test(`[GET ${url}/400] should response 200 and return rendered page`, async () => {
  await request(app).get(`${url}/400`)
                    .expect(200)
                    .expect('Content-Type', /text\/html/)
                    .then(res => {
                      expect(res.text).toMatch(/400 Bad Request/);
                    });
});


test(`[GET ${url}/403] should response 200 and return rendered page`, async () => {
  await request(app).get(`${url}/403`)
                    .expect(200)
                    .expect('Content-Type', /text\/html/)
                    .then(res => {
                      expect(res.text).toMatch(/403 Forbidden/);
                    });
});
