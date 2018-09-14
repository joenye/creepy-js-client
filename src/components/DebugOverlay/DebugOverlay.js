import React from 'react'

import './DebugOverlay.css'

const formatPos = pos => {
  if (pos) {
    return `(x=${pos.x || 0}, y=${pos.y || 0}, z=${pos.z || 0})`
  } else {
    return 'Unknown'
  }
}

const DebugOverlay = ({game}) => {
  return (
    <div className='DebugOverlay'>
      <p>
        Client Pos: {formatPos(game.currentPos)}
      </p>
      <p>
        Server Pos: {formatPos(game.mapPos)}
      </p>
    </div>
  )
}

export default DebugOverlay
