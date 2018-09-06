import React from 'react'

import './DebugOverlay.css'

const formatPosition = pos => {
  if (pos) {
    return `(${pos.x || 0}, ${pos.y || 0}, ${pos.z || 0})`
  } else {
    return 'Unknown'
  }
}

const DebugOverlay = (props) => {
  const state = props.state
  const {mapPos} = state

  return (
    <div className='DebugOverlay'>
      Position: {formatPosition(mapPos)}
    </div>
  )
}

export default DebugOverlay
