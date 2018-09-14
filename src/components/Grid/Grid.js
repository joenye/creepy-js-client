import React, { Component } from 'react'

import './Grid.css'

import Tile from '../Tile/Tile.js'
import Position from '../../utils/position.js'
import { getPropsAt, gridWidth, gridHeight } from '../../utils/positionGrid.js'

class Grid extends Component {
  renderTile (gridPosition) {
    return (
      <Tile
        key={[gridPosition.x, gridPosition.y, gridPosition.floor]}
        onClick={(event) => this.props.onClick(event, gridPosition)}
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
