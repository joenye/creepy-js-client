import './Grid.css';

import React, { Component } from 'react';

import Position, { downOf, upOf } from '../../utils/position';
import { getPropsAt, gridHeight, gridWidth } from '../../utils/positionGrid';
import Tile from '../Tile/Tile';

class Grid extends Component {
  renderTile(gridPosition) {
    const { currentFloor, tiles, onClick } = this.props;

    const pos = Position(gridPosition.x, gridPosition.y, currentFloor);
    return (
      <Tile
        key={JSON.stringify(pos)}
        pos={pos}
        onClick={(event, meta) => {
          if (!meta) {
            // Clicked a tile
            meta = { target: 'tile', targetPos: pos };
          }

          if (meta.target === 'stairs') {
            // Add targetPos to existing event
            if (meta.direction === 'up') {
              meta.targetPos = upOf(pos);
            }
            if (meta.direction === 'down') {
              meta.targetPos = downOf(pos);
            }
          }
          onClick(event, meta);
        }}
        // eslint-disable-next-line
        {...getPropsAt(tiles, gridPosition)}
      />
    );
  }

  renderRows() {
    const { tiles } = this.props;
    const render = [];
    for (let y = gridHeight(tiles) - 1; y >= 0; y -= 1) {
      const row = [];
      for (let x = 0; x < gridWidth(tiles); x += 1) {
        const gridPosition = Position(x, y);
        row.push(this.renderTile(gridPosition));
      }
      render.push(
        <tr key={y} className="Grid-row">
          {row}
        </tr>,
      );
    }
    return render;
  }

  render = () => (
    <table className="Grid">
      <tbody>{this.renderRows()}</tbody>
    </table>
  );
}

export default Grid;
