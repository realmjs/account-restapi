"use strict"

import { realm } from './env';
import { hashPassword } from '../../src/lib/util';

export default {
  USER: {
    find: jest.fn(createFindFunc('uid')),
    insert: jest.fn(insertUser),
    password: { update: jest.fn(updateUser) },
    verified: { update: jest.fn(updateUser) },
    profile: { update: jest.fn(updateUser) },
  },
  LOGIN: {
    find: jest.fn(createFindFunc('username')),
  }
};

function createFindFunc(prop) {
  return function (key) {
    return new Promise((resolve, reject) => {
      const usr = key[prop];
      if (usr === 'error' || usr === 'error@localhost.io') {
        reject('err');
        return;
      }
      if (usr === 'tester' || usr === 'tester@localhost.io') {
        const realms = {};
        realms[realm] = { roles: ['member'] };
        const salty = { head: 'head', tail: 'tail' };
        resolve({
          uid: 'tester',
          username: 'tester@localhost.io',
          salty,
          realms,
          profile: { displayName: 'tester', email: ['tester@localhost.io'],},
          credentials: { password: hashPassword('secret-pwd', salty) }
        });
      } else if (usr === 'verifiedtester' || usr === 'verifiedtester@localhost.io') {
        const realms = {};
        realms[realm] = { roles: ['member'] };
        const salty = { head: 'head', tail: 'tail' };
        resolve({
          uid: 'verifiedtester',
          username: 'verifiedtester@localhost.io',
          salty,
          realms,
          credentials: { password: hashPassword('secret-pwd', salty) },
          verify: true,
        });
      } else if (usr === 'error-updater' || usr === 'error-updater@localhost.io') {
        const realms = {};
        realms[realm] = { roles: ['member'] };
        const salty = { head: 'head', tail: 'tail' };
        resolve({
          uid: 'error-updater',
          username: 'error-updater@localhost.io',
          salty,
          realms,
          credentials: { password: hashPassword('secret-pwd', salty) }
        });
      } else if (usr === 'error-sender' || usr === 'error-sender@localhost.io') {
        const realms = {};
        realms[realm] = { roles: ['member'] };
        const salty = { head: 'head', tail: 'tail' };
        resolve({
          uid: 'error-sender',
          username: 'error-sender@localhost.io',
          salty,
          realms,
          profile: { displayName: 'error-sender', email: ['error-sender@localhost.io'],},
          credentials: { password: hashPassword('secret-pwd', salty) }
        });
      } else if (usr === 'norealm') {
        resolve({uid: 'norealm'});
      } else if (usr === 'outsider') {
        resolve({uid: 'outsider', realms: { 'outsider': true} });
      } else {
        resolve();
      }
    });
  }
}

function insertUser(user) {
  return new Promise((resolve, reject) => {
    if (user.username === 'error-inserter') reject('err')
    else resolve();
  });
}

function updateUser({uid}) {
  return new Promise((resolve, reject) => {
    if (uid === 'error-updater') reject(false)
    else resolve(true);
  });
}

