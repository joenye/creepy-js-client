import React, { Component } from 'react'

import './Game.css'

import Grid from '../Grid/Grid.js'
import ConnectedDebugOverlay from '../DebugOverlay/ConnectedDebugOverlay.js'
import ConnectedMessageOverlay from '../MessageOverlay/ConnectedMessageOverlay.js'

class Game extends Component {
  componentDidMount () {
    this.props.onMount()
  }

  render () {
    const { tiles, currentFloor, onClick } = this.props
    return (
      <div className='Game'>
        <ConnectedDebugOverlay />
        <ConnectedMessageOverlay />
        <Grid
          className='game'
          currentFloor={currentFloor}
          tiles={tiles[currentFloor]}
          onClick={onClick}
        />
      </div>
    )
  }
}

export default Game
