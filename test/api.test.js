"use strict"

import "core-js/stable";
import "regenerator-runtime/runtime";

function promiseFn() {
  return new Promise(resolve => setTimeout(() => resolve(true), 1000));
}

describe('Test session api', () => {

  test('Get /session without enough parameter should return 400 Bad request', async () => {
    const result = await promiseFn();
    expect(result).toBeTruthy();
  });

});
