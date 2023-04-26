"use strict"

import api from '../../src/api_v2';
import helpers from './helpers';

api.helpers(helpers);

import express from 'express';

const app = express();
app.use('/', api.generate());

export default app;
