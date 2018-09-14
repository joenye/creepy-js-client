import React from 'react'

import './Game.css'

import Grid from '../Grid/Grid.js'
import ConnectedDebugOverlay from '../DebugOverlay/ConnectedDebugOverlay.js'
import ConnectedMessageOverlay from '../MessageOverlay/ConnectedMessageOverlay.js'

const Game = ({ tiles, onClick }) => {
  return (
    <div className='Game'>
      <ConnectedDebugOverlay />
      <ConnectedMessageOverlay />
      <Grid
        className='game'
        tiles={tiles}
        onClick={onClick}
      />
    </div>
  )
}

export default Game
