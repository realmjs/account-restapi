"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

import express from 'express';
import request from 'supertest';

const app = express();

app.get('/user', function(req, res) {
  res.status(200).json({ name: 'alyx' });
});

describe('Test GET', () => {

  test('responds with json', async () => {
    await request(app).get('/user').expect(200).expect('Content-Type', /json/);
  });

});
