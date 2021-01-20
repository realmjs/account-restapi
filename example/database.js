"use strict"

const USERS = [];

const Database = {
  USER: {
    find: createFindFunc('uid'),
    insert: insertUser,
    update: updateUser,
    set: updateUser,
  },
  LOGIN: {
    find: createFindFunc('username'),
  }
}

module.exports = Database;

function createFindFunc(prop) {
  return function (expr) {
    return new Promise((resolve, reject) => {
      const usr = expr[prop].split('=')[1].trim();
      return USERS.filter(user => user[prop] === usr);
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

function updateUser({uid}, updater) {
  return new Promise((resolve, reject) => {
    const user = USERS.find(u => u.username === uid);
    if (user) {
      for (let prop in updater) {
        user[prop] = updater[prop];
      }
      resolve();
    } else {
      reject(`User ${uid} does not exist!`);
    }
  });
}