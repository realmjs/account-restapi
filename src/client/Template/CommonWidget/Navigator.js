"use strict"

import React, { PureComponent } from 'react'

export default class Navigator extends PureComponent {
  constructor(props) {
    super(props)
  }
  render() {
    return (
      <div>
        {
          this.props.routes.map( route => {
            return (
              <div key={route.name} className={route.animate || ''} style={{ display: route.name === this.props.activeRoute? 'block' : 'none' }}>
                { React.createElement(route.template, { active: route.name === this.props.activeRoute, ...this.props }) }
              </div>
            )
          })
        }
      </div>
    )
  }
}
