"use strict"

import { realm } from './env';
import Database from './database';

export default {
  Apps: [{ id: 'test', url: 'localhost', realm, key: 'test-key' }],
  Database,
  alert: jest.fn(msg => msg),
};
