"use strict"

import React from 'react';
import renderer from 'react-test-renderer';

import SSO from '../../src/client/template/SSO';

beforeEach(() => window.__data = { status: 200, session: 'user-session' });

test('Should match snapshot and call done when mounted', () => {
  const done = jest.fn(msg => msg);
  const component = renderer.create(
    <SSO done = {done} />
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
  expect(done).toHaveBeenCalled();
  expect(done.mock.results[0].value).toEqual({ status: 200, session: 'user-session'});
});
