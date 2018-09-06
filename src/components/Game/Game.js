import _ from 'lodash'
import React, { Component } from 'react'

import './Game.css'

import Grid from '../Grid/Grid.js'
import { TileVisibility } from '../Tile/Tile.js'
import DebugOverlay from '../DebugOverlay/DebugOverlay.js'
import Position, {
  northOf,
  eastOf,
  southOf,
  westOf
} from '../../utils/position.js'
import PositionGrid, {
  getElement,
  updateGridProps,
  updatePropsAt
} from '../../utils/positionGrid.js'

const getInitialTiles = (width, height, entrancePos) => {
  const defaultProps = {
    visibility: TileVisibility.HIDDEN,
    isLoading: false
  }
  const entranceProps = {
    ...defaultProps,
    visibility: TileVisibility.CURRENT
  }

  let tiles = PositionGrid(width, height)
  tiles = updateGridProps(tiles, defaultProps)
  tiles = updatePropsAt(tiles, entrancePos, entranceProps)

  return tiles
}

const updateVisibilities = (tiles_, width, height, currentPos, targetPos) => {
  let tiles = tiles_.slice()

  const directions = [northOf, eastOf, southOf, westOf]

  for (let direction of directions) {
    const currentPosOffset = direction(currentPos)
    if (isWithinBounds(currentPosOffset, width, height)) {
      tiles = updatePropsAt(tiles, currentPosOffset, {
        isCandidate: false
      })
    }

    const targetPosOffset = direction(targetPos)
    if (isWithinBounds(targetPosOffset, width, height)) {
      tiles = updatePropsAt(tiles, targetPosOffset, {
        isCandidate: true
      })
    }
  }

  tiles = updatePropsAt(tiles, currentPos, {
    visibility: TileVisibility.VISITED
  })
  tiles = updatePropsAt(tiles, targetPos, {
    visibility: TileVisibility.CURRENT
  })

  return tiles
}

const isWithinBounds = (pos, width, height) =>
  pos.x >= 0 && pos.y >= 0 && pos.x < width && pos.y < height

const getTargetDirection = (currentPos, targetPos) => {
  if (_.isEqual(targetPos, northOf(currentPos))) return 'up'
  if (_.isEqual(targetPos, eastOf(currentPos))) return 'right'
  if (_.isEqual(targetPos, southOf(currentPos))) return 'down'
  if (_.isEqual(targetPos, westOf(currentPos))) return 'left'
}

class Game extends Component {
  constructor (props) {
    super(props)
    const { width, height } = props

    const entrancePos = Position(Math.floor(width / 2), Math.floor(height / 2))
    let tiles = getInitialTiles(width, height, entrancePos)
    tiles = updateVisibilities(tiles, width, height, entrancePos, entrancePos)
    tiles = updatePropsAt(tiles, entrancePos, { isLoading: true, rotation: 0 })

    // TODO: Refactor as part of refresh logic
    fetch('http://localhost:5001/current')
      .then(resp => resp.text())
      .then(svgXml => this.setBackground(svgXml, entrancePos))

    this.state = {
      tiles: tiles,
      currentPos: entrancePos
    }
  }

  setBackground (svgXml, targetPos) {
    let tiles = this.state.tiles.slice()

    const updatedProps = {
      isLoading: false,
      background: svgXml
    }
    tiles = updatePropsAt(tiles, targetPos, updatedProps)
    this.setState({ tiles: tiles })
  }

  asyncNavigate (targetPos, targetDirection) {
    let tiles = this.state.tiles
    const targetTile = getElement(tiles, targetPos)
    const needsBg = Boolean(!targetTile.background)
    if (needsBg) {
      tiles = updatePropsAt(tiles, targetPos, { isLoading: true })
      this.setState({ tiles: tiles })
    }

    // TODO: Refactor to an API layer
    fetch('http://localhost:5001/navigate?direction=' + targetDirection)
      .then(resp => {
        if (resp.ok) {
          return resp.text()
        } else {
          throw new Error('The way is shut')
        }
      })
      .then(svgXml => {
        let tiles = this.state.tiles
        const currentPos = this.state.currentPos
        const { width, height } = this.props
        updateVisibilities(tiles, width, height, currentPos, targetPos)

        const updatedProps = {
          isLoading: false,
          background: svgXml
        }
        if (targetTile.rotation == null) {
          // Add a random tilt for visual effect
          updatedProps['rotation'] = _.random(-1.8, 1.5, true)
        }
        tiles = updatePropsAt(tiles, targetPos, updatedProps)
        this.setState({ tiles: tiles, currentPos: targetPos })
      })
      .catch(() => {
        let tiles = this.state.tiles
        tiles = updatePropsAt(tiles, targetPos, { isLoading: false })
        this.setState({ tiles: tiles })
        alert('The way is shut')
      })
  }

  handleClick (targetPos) {
    const currentPos = this.state.currentPos
    const targetDirection = getTargetDirection(currentPos, targetPos)
    if (!targetDirection) {
      return alert("You can't reach that tile")
    }
    this.asyncNavigate(targetPos, targetDirection)
  }

  render = () => (
    <div className='Game'>
      <DebugOverlay state={this.state} />
      <Grid
        className='game'
        tiles={this.state.tiles}
        onClick={targetPos => this.handleClick(targetPos)}
      />
    </div>
  );
}

export default Game
