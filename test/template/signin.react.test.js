"use strict"

import React from 'react';
import renderer from 'react-test-renderer';
import {screen, fireEvent, render} from '@testing-library/react';

import SignIn from '../../src/client/template/SignIn';

const done = jest.fn(msg => msg);
const close = jest.fn(msg => msg);
const data = {"route":"signin","targetOrigin":"localhost:3100","app":"account","query":{"app":"account","name":"signin"}};

beforeEach( () => jest.clearAllMocks() );

test('Should match snapshot of first scene (email) after mounted', () => {
  const component = renderer.create(
    <SignIn data = {data} done = {done} close = {close} />
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});


test.only('Should alert invalid if entering wrong email format', () => {
  render(
    <SignIn data = {data} done = {done} close = {close} />
  );
  // attemp to enter invalid email format

  const inputEmailNode = screen.getByLabelText('email');
  testInValidEMail(inputEmailNode, 'wrongemail', 'Invalid email');

  function testInValidEMail(node, text, error) {
    expect(screen.queryByText(error)).toBeNull();
    fireEvent.change(node, {target: { value: text } });
    fireEvent.keyUp(node, { keyCode: 13 });
    expect(screen.queryByText(error)).not.toBeNull();
    // when change value, error message should disapear
    fireEvent.change(node, {target: { value: '' } });
    expect(screen.queryByText(error)).toBeNull();
  }
});