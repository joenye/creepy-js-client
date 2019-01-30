import React from 'react'

import './PlayerMarker.css'

const WIDTH = 40

const getOffset = (pos) => {
  if (pos.x === 0) {
    // pos.x += WIDTH / 2
    pos.x += WIDTH
  } else if (pos.x === 600) {
    // pos.x -= WIDTH / 2
    pos.x -= WIDTH
  } else if (pos.y === 0) {
    // pos.y += WIDTH / 2
    pos.y += WIDTH
  } else if (pos.y === 400) {
    // pos.y -= WIDTH / 2
    pos.y -= WIDTH
  }
  return pos
}

const PlayerMarker = ({ pos }) => {
  const offsetPos = getOffset(pos)
  return (
    <div
      className='marker'
      style={{
        position: 'absolute',
        left: `${offsetPos.x - (WIDTH / 2)}px`,
        top: `${400 - offsetPos.y - (WIDTH / 2)}px`,
        width: `${WIDTH}px`,
        height: `${WIDTH}px`
      }}
    />
  )
}

export default PlayerMarker
