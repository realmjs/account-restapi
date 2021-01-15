"use strict"

export function expectUserIsSerialized(user) {
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

export const delay = ms => new Promise(res => setTimeout(res, ms));

export function setupEnvironmentVariables() {
  process.env.COOKIE_SECRET_KEY = 'test-cookie-enc-secret';
  process.env.PWD_PREFIX = 'head';
  process.env.PWD_SUFFIX = 'tail';
  process.env.DEFAULT_PROFILE_PICTURE = 'profile-picture';
  process.env.EMAIL_SIGN_KEY = 'email-sign-key';
  process.env.EMAIL_EXPIRE_RESET_LINK = '24h';
}

export function clearEnvironmentVariables() {
  process.env.COOKIE_SECRET_KEY = undefined;
  process.env.PWD_PREFIX = undefined;
  process.env.PWD_SUFFIX = undefined;
  process.env.DEFAULT_PROFILE_PICTURE = undefined;
  process.env.EMAIL_SIGN_KEY = undefined;
  process.env.EMAIL_EXPIRE_RESET_LINK = undefined;
}