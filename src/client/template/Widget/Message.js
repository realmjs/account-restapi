"use strict"

import React from 'react'

export default function(props) {
  return (
    <div className = "w3-text-red" style = {{height: '26px', marginBottom: '8px'}} >
      {props.message}
    </div>
  )
}
