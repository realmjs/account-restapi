"use strict"
import "core-js/stable";
import "regenerator-runtime/runtime";

import React from 'react';
import renderer from 'react-test-renderer';
import {screen, fireEvent, render} from '@testing-library/react';

import xhttp from '@realmjs/xhttp-request';
jest.mock('@realmjs/xhttp-request');

import SignIn from '../../src/client/template/SignIn';

const done = jest.fn(msg => msg);
const close = jest.fn(msg => msg);
const data = {"route":"signin","targetOrigin":"localhost:3100","app":"account","query":{"app":"account","name":"signin"}};

beforeEach( () => jest.clearAllMocks() );


function waitfor(cb) {
  return new Promise(resolve => {
    setTimeout(() => { cb && cb(); resolve(); }, 0);
  });
}

function enterEmail(email) {
  const inputEmailNode = screen.getByLabelText('email');
  const nextButtonNode = screen.getByText('Next');
  return inputText(inputEmailNode, nextButtonNode, email);
}

function resetEmailForm() {
  const inputEmailNode = screen.getByLabelText('email');
  fireEvent.change(inputEmailNode, {target: { value: '' } });
}

function enterPassword(password) {
  const inputPasswordNode = screen.getByLabelText('password');
  const sumitButtonNode = screen.getByText('Submit');
  return inputText(inputPasswordNode, sumitButtonNode, password);
}

function resetPasswordForm() {
  const inputPasswordNode = screen.getByLabelText('password');
  fireEvent.change(inputPasswordNode, {target: { value: '' } });
}

function inputText(inputTxtNode, actionBtnNode, text) {
  fireEvent.change(inputTxtNode, {target: { value: text } });
  fireEvent.click(actionBtnNode);
  return waitfor();
}

function expectNoErrorMessage(error) {
  return expect(screen.queryByText(error)).toBeNull();
}

function expectErrorMessage(error) {
  return expect(screen.queryByText(error)).not.toBeNull();
}

function expectXhttpGetUserCalledCorrectly() {
  return expect(xhttp.get.mock.calls[0][0]).toMatch(/(\/user\?u=.*&app=.*|\/user\?app=.*&u=.*)/);
}

function expectXhttpPostSessionCalledCorrectly(credential) {
  expect(xhttp.post.mock.calls[0][0]).toMatch(/\/session/);
  expect(xhttp.post.mock.calls[0][1]).toEqual({
    username: credential.email,
    password: credential.password,
    app: 'account',
  });
}

test('Should match snapshot of first scene (email) after mounted', () => {
  const component = renderer.create(
    <SignIn data = {data} done = {done} close = {close} />
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});


test('Should alert invalid if entering wrong email format', () => {
  render(
    <SignIn data = {data} done = {done} close = {close} />
  );
  // attemp to enter invalid email format

  const inputEmailNode = screen.getByLabelText('email');
  testInValidEmail(inputEmailNode, 'wrongemail', 'Invalid email');
  testInValidEmail(inputEmailNode, 'email@', 'Invalid email');
  testInValidEmail(inputEmailNode, 'email@domain', 'Invalid email');
  testInValidEmail(inputEmailNode, '<script>alert("hacked")</script>', 'Invalid email');
  testInValidEmail(inputEmailNode, '', 'Email is empty');

  function testInValidEmail(node, text, error) {
    expect(screen.queryByText(error)).toBeNull();
    fireEvent.change(node, {target: { value: text } });
    fireEvent.keyUp(node, { keyCode: 13 });
    expect(screen.queryByText(error)).not.toBeNull();
    // when change value, error message should disapear
    fireEvent.change(node, {target: { value: 'a' } });
    expect(screen.queryByText(error)).toBeNull();
  }
});


test('Should alert Not registered if entering valid but unregistered email', async () => {

  xhttp.get.mockResolvedValue({ status: 404 });

  render(
    <SignIn data = {data} done = {done} close = {close} />
  );

  await testWithEmail('newtester@team.com');
  await testWithEmail('new.tester123@my.team.com');

  // supporting functions

  async function testWithEmail(email) {
    resetEmailForm();
    expectNoErrorMessage('Not registered');
    await enterEmail('new.tester123@my.team.com');
    expectXhttpGetUserCalledCorrectly();
    expectErrorMessage('Not registered');
    return Promise.resolve();
  }

});


test('Should move to Password scene after entering a registered email and back after clicking back button', async () => {

  xhttp.get.mockResolvedValue({ status: 200 });

  const { container } = render( <SignIn data = {data} done = {done} close = {close} /> );

  await enterEmail('tester@localhost.io');

  expectXhttpGetUserCalledCorrectly();
  expect(container).toMatchSnapshot();

  const backButtonNode = screen.getAllByText('Back')[0];
  fireEvent.click(backButtonNode);
  await waitfor( () => expect(container).toMatchSnapshot() );

});


test('Should show error failed to signing in if entered wrong password', async () => {

  xhttp.get.mockResolvedValue({ status: 200 });
  xhttp.post.mockResolvedValue({ status: 400 });

  render( <SignIn data = {data} done = {done} close = {close} /> );

  const credential = {
    email: 'tester@localhost.io',
    password: 'wrong-password',
  };

  await enterEmail(credential.email);

  expectNoErrorMessage('Error: Failed to signing in');
  await enterPassword(credential.password);

  expectXhttpPostSessionCalledCorrectly(credential);

  expectErrorMessage('Error: Failed to signing in');

});


test('Should call done and move to Welcome page after signed in successfully', async () => {

  xhttp.get.mockResolvedValue({ status: 200 });
  xhttp.post.mockResolvedValue({ status: 200, responseText: '{"uid":"tester"}' });

  const { container } = render( <SignIn data = {data} done = {done} close = {close} /> );

  await enterEmail('tester@localhost.io');
  await enterPassword('correct-password');

  expect(done.mock.results[0].value).toEqual({ status: 200, session: { uid: 'tester' } });

  expect(container).toMatchSnapshot();

});
