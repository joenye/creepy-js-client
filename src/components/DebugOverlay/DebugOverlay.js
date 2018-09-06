import React from 'react'

import './DebugOverlay.css'

const formatPosition = pos => `(${pos.x || 0}, ${pos.y || 0}, ${pos.z || 0})`

const DebugOverlay = (props) => {
  const state = props.state
  const {currentPos} = state

  return (
    <div className='DebugOverlay'>
      Position: {formatPosition(currentPos)}
    </div>
  )
}

export default DebugOverlay
