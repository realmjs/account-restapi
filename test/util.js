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

/* util support testing react compinent */

import { screen, fireEvent } from '@testing-library/react';

export function waitfor(cb) {
  return new Promise(resolve => {
    setTimeout(() => { cb && cb(); resolve(); }, 0);
  });
}

export function enterEmail(email) {
  const inputEmailNode = screen.getByLabelText('email');
  const nextButtonNode = screen.getByText('Next');
  return inputText(inputEmailNode, nextButtonNode, email);
}

export function resetEmailForm() {
  const inputEmailNode = screen.getByLabelText('email');
  fireEvent.change(inputEmailNode, {target: { value: '' } });
}

export function enterPassword(password) {
  const inputPasswordNode = screen.getByLabelText('password');
  const sumitButtonNode = screen.getByText('Submit');
  return inputText(inputPasswordNode, sumitButtonNode, password);
}

export function resetPasswordForm() {
  const inputPasswordNode = screen.getByLabelText('password');
  fireEvent.change(inputPasswordNode, {target: { value: '' } });
}

export function inputText(inputTxtNode, actionBtnNode, text) {
  fireEvent.change(inputTxtNode, {target: { value: text } });
  fireEvent.click(actionBtnNode);
  return waitfor();
}

export function expectNoErrorMessage(error) {
  return expect(screen.queryByText(error)).toBeNull();
}

export function expectErrorMessage(error) {
  return expect(screen.queryByText(error)).not.toBeNull();
}

import xhttp from '@realmjs/xhttp-request';

export function expectXhttpGetUserCalledCorrectly() {
  return expect(xhttp.get.mock.calls[0][0]).toMatch(/(\/user\?u=.*&app=.*|\/user\?app=.*&u=.*)/);
}

export function expectXhttpPostSessionCalledCorrectly(credential) {
  expect(xhttp.post.mock.calls[0][0]).toMatch(/\/session/);
  expect(xhttp.post.mock.calls[0][1]).toEqual({
    username: credential.email,
    password: credential.password,
    app: 'account',
  });
}