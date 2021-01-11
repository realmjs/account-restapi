"use strict"

import { realm } from './env';

export default {
  USERS: {
    find: createFindFunc('uid'),
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
        resolve([ {uid: 'tester', username: 'tester', realms, credentials: { password: 'secret-pwd' } } ]);
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
