import React from 'react'

import './Tile.css'

import LoadingWheel from '../LoadingWheel/LoadingWheel.js'

export const TileVisibility = {
  HIDDEN: 'hidden',
  CURRENT: 'current',
  VISITED: 'visited'
}

const Tile = ({
  background,
  isLoading,
  isCandidate,
  visibility,
  rotation,
  onClick
}) => (
  <td className={`Tile ${visibility}`} onClick={onClick}>
    <div className='container'>
      { isLoading && <LoadingWheel /> }
      <div
        className={`
          overlay
          ${isCandidate ? 'is-candidate' : ''}
          ${isLoading ? 'is-loading' : ''}
          ${visibility}`}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {background && <span dangerouslySetInnerHTML={{ __html: background }} />}
      </div>
    </div>
  </td>
)

export default Tile
