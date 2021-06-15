"use strict"
import "core-js/stable";
import "regenerator-runtime/runtime";

import React from 'react';
import renderer from 'react-test-renderer';

import { waitfor } from '../util';

import SignOut from '../../src/client/template/SignOut';

import xhttp from '@realmjs/xhttp-request';
jest.mock('@realmjs/xhttp-request');

test('Should match snapshot and call done when mounted', async () => {
  xhttp.delete.mockResolvedValue({ status: 200 });
  const done = jest.fn(msg => msg);
  const component = renderer.create(
    <SignOut data = {{ app: 'account' }} done = {done} />
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
  await waitfor( () => expect(done).toHaveBeenCalled() );
  expect(xhttp.delete.mock.calls[0][0]).toMatch(/^\/session$/)
  expect(done.mock.results[0].value).toEqual({status: 200});
});
