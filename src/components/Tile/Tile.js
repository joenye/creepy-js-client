import React, { Component } from 'react'
import scrollIntoView from 'scroll-into-view'
import classNames from 'classnames'

import './Tile.css'

import Entity from '../Entity/Entity.js'
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
    const {
      background, entities, isLoading, isFocused, isCandidate, pos,
      visibility, rotation
    } = this.props
    if (this.props.pos[0] === 4 && this.props.pos[1] === 4) {
      console.log(this.props)
    }
    const { onClick } = this.props

    if (isFocused && this.ref.current) {
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
            className={classNames(
              'overlay',
              isCandidate && 'is-candidate',
              isLoading && 'is-loading',
              visibility)}
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {entities && Object.entries(entities).map(([entity, val]) => {
              const key = [pos, entity]
              switch (entity) {
                case 'stairs_up':
                  return <Entity.StairsUp pos={val.pos} key={key} onClick={onClick} />
                case 'stairs_up_secret':
                  return <Entity.StairsUp pos={val.pos} isSecret key={key} onClick={onClick} />
                case 'stairs_down':
                  return <Entity.StairsDown pos={val.pos} key={key} onClick={onClick} />
                case 'stairs_down_secret':
                  return <Entity.StairsDown pos={val.pos} isSecret key={key} onClick={onClick} />
                default:
                  return ''
              }
            })}
            {background && <span dangerouslySetInnerHTML={{ __html: background }} />}
          </div>
        </div>
      </td>
    )
  }
}

export default Tile
