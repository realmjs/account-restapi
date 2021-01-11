"use strict"

import api from '../../src/api';
import helpers from './helpers';

api.helpers(helpers);

import express from 'express';

const app = express();
app.use('/', api.generate());

export default app;
