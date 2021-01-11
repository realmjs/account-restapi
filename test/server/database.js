"use strict"

import { realm } from './env';

export default {
  USERS: {
    find: (expr) => {
      return new Promise((resolve, reject) => {
        const uid = expr.uid.split('=')[1].trim();
        if (uid === 'error') {
          reject('err');
          return;
        }
        if (uid === 'tester') {
          const realms = {};
          realms[realm] = true;
          resolve([ {uid: 'tester', realms, credentials: { password: 'secret-pwd' } } ]);
        } else if (uid === 'norealm') {
          resolve([ {uid: 'norealm'} ]);
        } else if (uid === 'outsider') {
          resolve([ {uid: 'outsider', realms: { 'outsider': true} } ]);
        } else {
          resolve([]);
        }
      });
    }
  }
};
