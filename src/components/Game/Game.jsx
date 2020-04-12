import './Game.scss';

import React, { Component } from 'react';

import ConnectedDebugOverlay from '../DebugOverlay/ConnectedDebugOverlay';
import Grid from '../Grid/Grid';
import ConnectedMessageOverlay from '../MessageOverlay/ConnectedMessageOverlay';

class Game extends Component {
  componentDidMount() {
    const { onMount } = this.props;
    onMount();
  }

  render() {
    const { tiles, currentFloor, onClick } = this.props;
    return (
      <div className="Game">
        <ConnectedDebugOverlay />
        <ConnectedMessageOverlay />
        <Grid className="game" currentFloor={currentFloor} tiles={tiles[currentFloor]} onClick={onClick} />
      </div>
    );
  }
}

export default Game;
