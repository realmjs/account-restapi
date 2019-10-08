"use strict"

import React from 'react'

export default function (props) {
  return (
    <div>
      <button className = "w3-button w3-border" style = {{marginBottom: '16px'}}
              onClick = {props.onClick} >
        <i className = "fa fa-arrow-left" /> { props.title || 'Back' }
      </button>
    </div>
  )
}
