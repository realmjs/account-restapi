"use strict"

import { realm } from './env';
import { hashPassword } from '../../src/lib/util';

export default {
  USER: {
    find: createFindFunc('uid'),
    insert: insertUser,
    update: updateUser,
  },
  LOGIN: {
    find: createFindFunc('username'),
  }
};

function createFindFunc(prop) {
  return function (expr) {
    return new Promise((resolve, reject) => {
      const usr = expr[prop].split('=')[1].trim();
      if (usr === 'error') {
        reject('err');
        return;
      }
      if (usr === 'tester') {
        const realms = {};
        realms[realm] = true;
        resolve([{
          uid: 'tester',
          username: 'tester',
          email: 'tester',
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
