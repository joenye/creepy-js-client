import React, { Component } from 'react'

import './Grid.css'

import Tile from '../Tile/Tile.js'
import Position, { upOf, downOf } from '../../utils/position.js'
import { getPropsAt, gridWidth, gridHeight } from '../../utils/positionGrid.js'

class Grid extends Component {
  renderTile (gridPosition) {
    let pos = Position(gridPosition.x, gridPosition.y, this.props.currentFloor)
    return (
      <Tile
        key={JSON.stringify(pos)}
        pos={pos}
        onClick={(event, meta) => {
          if (!meta) {
            // Clicked a tile
            meta = { 'target': 'tile', 'targetPos': pos }
          }

          if (meta.target === 'stairs') {
            // Add targetPos to existing event
            if (meta.direction === 'up') {
              meta.targetPos = upOf(pos)
            }
            if (meta.direction === 'down') {
              meta.targetPos = downOf(pos)
            }
          }
          this.props.onClick(event, meta)
        }}
        {...getPropsAt(this.props.tiles, gridPosition)}
      />
    )
  }

  renderRows () {
    const render = []
    for (let y = gridHeight(this.props.tiles) - 1; y >= 0; y--) {
      const row = []
      for (let x = 0; x < gridWidth(this.props.tiles); x++) {
        const gridPosition = Position(x, y)
        row.push(this.renderTile(gridPosition))
      }
      render.push(
        <tr key={y} className='Grid-row'>
          {row}
        </tr>
      )
    }
    return render
  }

  render = () => (
    <table className='Grid'>
      <tbody>{this.renderRows()}</tbody>
    </table>
  )
}

export default Grid
