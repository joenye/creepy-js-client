import React, { Component } from 'react'
import scrollIntoView from 'scroll-into-view'

import './Tile.css'

import LoadingWheel from '../LoadingWheel/LoadingWheel.js'

export const TileVisibility = {
  HIDDEN: 'hidden',
  CURRENT: 'current',
  VISITED: 'visited'
}

class Tile extends Component {
  constructor (props) {
    super(props)
    this.ref = React.createRef()
  }

  render () {
    const { background, isLoading, isCandidate, visibility, rotation, onClick } = this.props
    if (this.props.isLoading && this.ref.current) {
      scrollIntoView(this.ref.current, {
        time: 200,
        align: {
          top: 0.5,
          left: 0.5
        }
      })
      // this.ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    return (
      <td className={`Tile ${visibility}`} onClick={onClick} ref={this.ref}>
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
  }
}

export default Tile
