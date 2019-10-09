"use strict"

if (module.hot) { module.hot.accept() }

import React from 'react'
import { render } from "react-dom"

import { postMessage } from "../../lib/message"
import App from '../Template/App'

document.addEventListener("DOMContentLoaded", function(event) {
  postMessage('iframe.loaded',  {height: 615, width: 460})
  render(<App data = {__data} xclose = {xclose} xdone = {xdone} />, document.getElementById("root"))
})

function xclose() {
  postMessage('iframe.close')
}

function xdone(attr) {
  postMessage('iframe.done', attr)
}
