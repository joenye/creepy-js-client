import './Entity.scss';

import classNames from 'classnames';
import React from 'react';

const STAIRS_WIDTH = 55;
const Entity = (_props) => {};

Entity.StairsUp = ({ pos, isSecret, onClick }) => {
  return (
    <div
      className={classNames('stairs-up', isSecret && 'stairs-up__secret')}
      style={{
        position: 'absolute',
        left: `${pos.x - STAIRS_WIDTH / 2}px`,
        top: `${400 - pos.y - STAIRS_WIDTH / 2}px`,
        width: `${STAIRS_WIDTH}px`,
        height: `${STAIRS_WIDTH}px`,
      }}
      onClick={(event, meta) => {
        if (!meta) {
          meta = { target: 'stairs', direction: 'up' };
          event.stopPropagation();
          onClick(event, meta);
        }
      }}
    />
  );
};

Entity.StairsDown = ({ pos, isSecret, onClick }) => {
  return (
    <div
      className={classNames('stairs-down', isSecret && 'stairs-down__secret')}
      style={{
        position: 'absolute',
        left: `${pos.x - STAIRS_WIDTH / 2}px`,
        top: `${400 - pos.y - STAIRS_WIDTH / 2}px`,
        width: `${STAIRS_WIDTH}px`,
        height: `${STAIRS_WIDTH}px`,
      }}
      onClick={(event, meta) => {
        if (!meta) {
          meta = { target: 'stairs', direction: 'down' };
          event.stopPropagation();
          onClick(event, meta);
        }
      }}
    />
  );
};

export default Entity;
