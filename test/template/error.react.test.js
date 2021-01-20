"use strict"

import React from 'react';
import renderer from 'react-test-renderer';
import {screen, fireEvent, render} from '@testing-library/react';

import Error from '../../src/client/Template/Error';

test('Should match snapshot and call done when mounted', () => {
  const done = jest.fn(msg => msg);
  const error = {
    code: 400, detail: 'Bad Request',
  }
  const component = renderer.create(
    <Error data = {{ error }} done = {done} />
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
  expect(done).toHaveBeenCalled();
  expect(done.mock.results[0].value).toEqual({status: 400});
});


test('Should call close when click to <span>x</span>', () => {
  const done = jest.fn(msg => msg);
  const close = jest.fn();
  const error = {
    code: 400, detail: 'Bad Request',
  }
  render(
    <Error data = {{ error }} done = {done} close = {close} />
  );
  fireEvent.click(screen.getByText('\u00D7'));  // \u00D7 is unicode of '×'
  expect(close).toHaveBeenCalled();
});
