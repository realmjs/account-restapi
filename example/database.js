"use strict"

const { hashPassword } = require('../src/lib/util');

const USERS = [
  {
    uid: 'tester',
    username: 'tester@localhost.io',
    realms: { 'public': { role: 'member' } },
    profile: { displayName: 'Tester', email: ['tester@localhost.io'],},
    credentials: { password: hashPassword('123') }
  },
];

const Database = {
  USER: {
    find: createFindFunc('uid'),
    insert: insertUser,
    password: { update: updatePassword },
    verified: { update: updateVerified },
    profile: { update: updateProfile },
  },
  LOGIN: {
    find: createFindFunc('username'),
  }
}

module.exports = Database;

function createFindFunc(prop) {
  return function (key) {
    return new Promise((resolve, reject) => {
      const usr = key[prop];
      resolve(USERS.find(user => user[prop] === usr));
    });
  }
}

function insertUser(user) {
  return new Promise((resolve, reject) => {
    if (USERS.find(u => u.username === user.username)) {
      reject(`User ${user.username} exist!`);
    } else {
      USERS.push(user);
      resolve(user);
    }
  });
}

function updatePassword({ uid }, password) {
  const user = USERS.find(u => u.uid === uid);
  user.credentials.password = password;
  return Promise.resolve();
}

function updateVerified({ uid }, status) {
  const user = USERS.find(u => u.uid === uid);
  user.verified = status;
  return Promise.resolve();
}

function updateProfile({ uid }, profile) {
  const user = USERS.find(u => u.uid === uid);
  for (let prop in profile) {
    user.profile[prop] = profile[prop];
  }
  return Promise.resolve();
}
