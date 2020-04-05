import './DebugOverlay.css';

import React from 'react';

const formatPos = (pos) => {
  if (pos) {
    return `(x=${pos.x || 0}, y=${pos.y || 0}, z=${pos.z || 0})`;
  }
  return 'Unknown';
};

const DebugOverlay = ({ game }) => {
  return (
    <div className="DebugOverlay">
      <p>Client Pos: {formatPos(game.clientPos)}</p>
      <p>Client Offset: {formatPos(game.clientOffset)}</p>
    </div>
  );
};

export default DebugOverlay;
