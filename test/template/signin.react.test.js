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
    setTimeout(() => { cb(); resolve(); }, 0);
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

  const inputEmailNode = screen.getByLabelText('email');
  await expectShowError(inputEmailNode, 'newtester@team.com', 'Not registered');
  await expectShowError(inputEmailNode, 'new.tester123@my.team.com', 'Not registered');

  function expectShowError(node, text, error) {
      fireEvent.change(node, {target: { value: '' } });
      expect(screen.queryByText(error)).toBeNull();
      fireEvent.change(node, {target: { value: text } });
      fireEvent.keyUp(node, { keyCode: 13 });
      expect(xhttp.get.mock.calls[0][0]).toMatch(/(\/user\?u=.*&app=.*|\/user\?app=.*&u=.*)/);
      return screen.findByText(error);
  }

});


test('Should move to Password scene after entering a registered email and back after clicking back button', async () => {

  xhttp.get.mockResolvedValue({ status: 200 });

  const { container } = render( <SignIn data = {data} done = {done} close = {close} /> );

  const inputEmailNode = screen.getByLabelText('email');
  const nextButtonNode = screen.getByText('Next');
  fireEvent.change(inputEmailNode, {target: { value: 'tester@localhost.io' } });
  fireEvent.click(nextButtonNode);
  expect(xhttp.get.mock.calls[0][0]).toMatch(/(\/user\?u=.*&app=.*|\/user\?app=.*&u=.*)/);
  await waitfor( () => expect(container).toMatchSnapshot() );

  const backButtonNode = screen.getAllByText('Back')[0];
  fireEvent.click(backButtonNode);
  await waitfor( () => expect(container).toMatchSnapshot() );

});

