"use strict"
import "core-js/stable";
import "regenerator-runtime/runtime";

import React from 'react';
import renderer from 'react-test-renderer';
import {screen, fireEvent, render} from '@testing-library/react';

import { waitfor, inputText, enterEmail, enterPassword, enterRetypePassword, expectNoErrorMessage, expectErrorMessage, expectXhttpGetUserCalledCorrectly, expectXhttpPostUserCalledCorrectly } from '../util';

import xhttp from '@realmjs/xhttp-request';
jest.mock('@realmjs/xhttp-request');

import SignUp from '../../src/client/template/SignUp';

const done = jest.fn(msg => msg);
const close = jest.fn(msg => msg);
const data = {"route":"signup","targetOrigin":"localhost:3100","app":"account","query":{"app":"account","name":"signup"}};

beforeEach( () => jest.clearAllMocks() );

test('Should match snapshot of first scene (email) after mounted', () => {
  const component = renderer.create(
    <SignUp data = {data} done = {done} close = {close} />
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('Should show message invalid if entering wrong email format', () => {
  render(
    <SignUp data = {data} done = {done} close = {close} />
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


test('Should show error message if email is already used', async () => {

  xhttp.get.mockResolvedValue({ status: 200 });

  render( <SignUp data = {data} done = {done} close = {close} /> );

  await enterEmail('tester@localhost.io');
  expectXhttpGetUserCalledCorrectly();
  expectErrorMessage('This email has been used');

});


test('Should move to Password scene after entered unregistered email and move back if clicked Back button', async () => {

  xhttp.get.mockResolvedValue({ status: 404 });

  const { container } = render( <SignUp data = {data} done = {done} close = {close} /> );

  await enterEmail('newtester@localhost.io');
  expectXhttpGetUserCalledCorrectly();
  expectNoErrorMessage('This email has been used');
  expect(container).toMatchSnapshot();

  const backButtonNode = screen.getAllByText('Back')[0];
  fireEvent.click(backButtonNode);
  await waitfor( () => expect(container).toMatchSnapshot() );

});


test('Should show error if password is left empty', async () => {
  xhttp.get.mockResolvedValue({ status: 404 });

  const { container } = render( <SignUp data = {data} done = {done} close = {close} /> );

  await enterEmail('newtester@localhost.io');
  fireEvent.click(screen.getAllByText('Continue')[0]);
  expectErrorMessage('Password must not empty');
});


test('Should show message if password mismatch', async () => {
  xhttp.get.mockResolvedValue({ status: 404 });

  const { container } = render( <SignUp data = {data} done = {done} close = {close} /> );

  await enterEmail('newtester@localhost.io');

  await enterPassword('welcome123', undefined, 9); // 9 = TAB
  await enterRetypePassword('we1come123', undefined, 13); // 13 = Enter
  expectErrorMessage('Password mismatch');

  await enterRetypePassword('welcome', undefined, 13); // 13 = Enter
  expectErrorMessage('Password mismatch');

  await enterRetypePassword('welcome12345', undefined, 13); // 13 = Enter
  expectErrorMessage('Password mismatch');

});


test('Should move to Profile scene if password is matched and move back if back button is clicked', async () => {
  xhttp.get.mockResolvedValue({ status: 404 });

  const { container } = render( <SignUp data = {data} done = {done} close = {close} /> );

  await enterEmail('newtester@localhost.io');
  await enterPassword('secret', undefined, 9); // 9 = TAB
  await enterRetypePassword('secret', undefined, 13); // 13 = Enter
  expectNoErrorMessage('Password must not empty');
  expectNoErrorMessage('Password mismatch');
  expect(container).toMatchSnapshot();

  const backButtonNode = screen.getAllByText('Back')[1];
  fireEvent.click(backButtonNode);
  await waitfor( () => expect(container).toMatchSnapshot() );

});


test('Should able to move to Term and Service scene', async () => {
  xhttp.get.mockResolvedValue({ status: 404 });

  const { container } = render( <SignUp data = {data} done = {done} close = {close} /> );

  await enterEmail('newtester@localhost.io');
  await enterPassword('secret', undefined, 9); // 9 = TAB
  await enterRetypePassword('secret', undefined, 13); // 13 = Enter

  await inputText(screen.getByLabelText('fullname'), undefined, 'Tester', 13);
  fireEvent.click(screen.getAllByText('Continue')[1]);

  expect(container).toMatchSnapshot();

  const backButtonNode = screen.getAllByText('Back')[2];
  fireEvent.click(backButtonNode);
  await waitfor( () => expect(container).toMatchSnapshot() );

});


test('Should proceed to last scene only if checkbox is checked', async () => {
  xhttp.get.mockResolvedValue({ status: 404 });
  xhttp.post.mockResolvedValue({ status: 200, responseText: '{"session": {"uid":"tester"}}' });
  const { container } = render( <SignUp data = {data} done = {done} close = {close} /> );

  const user = {
    email: 'newtester@localhost.io',
    password: 'secret',
    profile: { fullName: 'Tester' },
  }

  await enterEmail(user.email);
  await enterPassword(user.password, undefined, 9); // 9 = TAB
  await enterRetypePassword(user.password, undefined, 13); // 13 = Enter
  await inputText(screen.getByLabelText('fullname'), undefined, user.profile.fullName, 13);
  fireEvent.click(screen.getAllByText('Continue')[1]);

  fireEvent.click(screen.getByText('Submit'));
  expect(container).toMatchSnapshot();

  fireEvent.click(screen.getByLabelText('terms'));
  fireEvent.click(screen.getByText('Submit'));
  await waitfor( () => expect(container).toMatchSnapshot() );
  expect(done.mock.results[0].value).toEqual({ status: 200, session: { uid: 'tester' } });
  expectXhttpPostUserCalledCorrectly(user);

});