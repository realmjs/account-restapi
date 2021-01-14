"use strict"

import { realm } from './env';
import Database from './database';

export default {
  Apps: [
    { id: 'test', url: 'localhost', realm, key: 'test-key' },
    { id: 'account', url: 'localhost', realm, key: 'account-key' }
  ],
  Database,
  alert: jest.fn(msg => msg),
  sendEmail: jest.fn( ({recipient, template, data}) => {
    return new Promise((resolve, reject) => {
      if (recipient[0].address === 'error@localhost') {
        reject();
      }
      resolve();
    });
  }),
  hooks: [
    jest.fn(({user}) => {
      if (user.username == 'error@localhost') return Promise.reject(false);
      return Promise.resolve();
    }),
  ],
};
