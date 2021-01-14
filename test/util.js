"use strict"

export function expectUserSerialized(user) {
  expect(user).not.toHaveProperty('uid');
  expect(user).not.toHaveProperty('credentials');
  expect(user).not.toHaveProperty('realms');
}

export function expectLoginSession(session) {
  expect(session).toHaveProperty('user');
  expect(session.user).not.toHaveProperty('uid');
  expect(session.user).not.toHaveProperty('credentials');
  expect(session.user).not.toHaveProperty('realms');
  expect(session).toHaveProperty('token');
  expect(session).toHaveProperty('sid');
}
