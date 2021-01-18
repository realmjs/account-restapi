"use strict"

import { realm } from './env';
import { hashPassword } from '../../src/lib/util';

export default {
  USER: {
    find: jest.fn(createFindFunc('uid')),
    insert: jest.fn(insertUser),
    update: jest.fn(updateUser),
    set: jest.fn(setUserProp),
  },
  LOGIN: {
    find: jest.fn(createFindFunc('username')),
  }
};

function createFindFunc(prop) {
  return function (expr) {
    return new Promise((resolve, reject) => {
      const usr = expr[prop].split('=')[1].trim();
      if (usr === 'error' || usr === 'error@localhost.io') {
        reject('err');
        return;
      }
      if (usr === 'tester' || usr === 'tester@localhost.io') {
        const realms = {};
        realms[realm] = { roles: ['member'] };
        resolve([{
          uid: 'tester',
          username: 'tester@localhost.io',
          email: ['tester@localhost.io'],
          realms,
          credentials: { password: hashPassword('secret-pwd') }
        }]);
      } else if (usr === 'verifiedtester' || usr === 'verifiedtester@localhost.io') {
        const realms = {};
        realms[realm] = { roles: ['member'] };
        resolve([{
          uid: 'verifiedtester',
          username: 'verifiedtester@localhost.io',
          email: ['verifiedtester@localhost.io'],
          realms,
          credentials: { password: hashPassword('secret-pwd') },
          verify: true,
        }]);
      } else if (usr === 'error-updater' || usr === 'error-updater@localhost.io') {
        const realms = {};
        realms[realm] = { roles: ['member'] };
        resolve([{
          uid: 'error-updater',
          username: 'error-updater@localhost.io',
          email: ['error-updater@localhost.io'],
          realms,
          credentials: { password: hashPassword('secret-pwd') }
        }]);
      } else if (usr === 'error-sender' || usr === 'error-sender@localhost.io') {
        const realms = {};
        realms[realm] = { roles: ['member'] };
        resolve([{
          uid: 'error-sender',
          username: 'eerror-sender@localhost.io',
          email: ['error-sender@localhost.io'],
          realms,
          credentials: { password: hashPassword('secret-pwd') }
        }]);
      } else if (usr === 'norealm') {
        resolve([ {uid: 'norealm'} ]);
      } else if (usr === 'outsider') {
        resolve([ {uid: 'outsider', realms: { 'outsider': true} } ]);
      } else {
        resolve([]);
      }
    });
  }
}

function insertUser(user) {
  return new Promise((resolve, reject) => {
    if (user.username === 'error-inserter') reject('err')
    else resolve(user);
  });
}

function updateUser({uid}) {
  return new Promise((resolve, reject) => {
    if (uid === 'error-updater') reject(false)
    else resolve(true);
  });
}

function setUserProp({uid}) {
  return new Promise((resolve, reject) => {
    if (uid === 'error-updater') reject(false)
    else resolve(true);
  });
}
