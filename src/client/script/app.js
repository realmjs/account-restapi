"use strict"

if (module.hot) {
  module.hot.accept('../Template/App', () => {
    render(<App data = {__data} close = {xclose} done = {xdone} />, document.getElementById("root"));
  });
}

import React from 'react'
import { render } from "react-dom"

import { postMessage } from "../../lib/message"
import App from '../Template/App'

document.addEventListener("DOMContentLoaded", function(event) {
  postMessage('iframe.loaded',  {height: __data.height || 615, width: __data.width || 460});
  render(<App data = {__data} close = {xclose} done = {xdone} />, document.getElementById("root"));
});

function xclose() {
  postMessage('iframe.close');
}

function xdone(attr) {
  postMessage('iframe.done', attr);
}
