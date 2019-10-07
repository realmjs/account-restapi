"use strict"

if (module.hot) { module.hot.accept() }

import React from 'react'
import { render } from "react-dom"

import App from '../template/App'

render(<App data = {__data} />, document.getElementById("root"))
