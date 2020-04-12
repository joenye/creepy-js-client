import './Tile.scss';

import classNames from 'classnames';
import React, { Component } from 'react';
import scrollIntoView from 'scroll-into-view';

import Entity from '../Entity/Entity';
import LoadingWheel from '../LoadingWheel/LoadingWheel';
import PlayerMarker from '../PlayerMarker/PlayerMarker';

export const TileVisibility = {
  HIDDEN: 'hidden',
  CURRENT: 'current',
  VISITED: 'visited',
};

class Tile extends Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  getBackground = (floor) => {
    switch (floor) {
      case 0:
        return '#9B7653';
      case 1:
        return '#72471D';
      case 2:
        return '#9B3C09';
      case 3:
        return '#B2370A';
      case 4:
        return '#B2120A';
      default:
        return '#5E065B';
    }
  };

  render() {
    const {
      background,
      entities,
      isLoading,
      isFocused,
      isCandidate,
      pos,
      markerPos,
      visibility,
      rotation,
    } = this.props;
    const { onClick } = this.props;

    if (isFocused && this.ref.current) {
      scrollIntoView(this.ref.current, {
        time: 300,
        align: {
          top: 0.5,
          left: 0.5,
        },
      });
      // this.ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    return (
      <td className={`Tile ${visibility}`} onClick={onClick} ref={this.ref}>
        <div className="container">
          {isLoading && <LoadingWheel />}
          <div
            className={classNames('overlay', isCandidate && 'is-candidate', isLoading && 'is-loading', visibility)}
            style={{ transform: `rotate(${rotation}deg)`, background: this.getBackground(pos.z) }}
          >
            {entities &&
              Object.entries(entities).map(([entity, val]) => {
                const key = [JSON.stringify(pos), JSON.stringify(entity)];
                switch (entity) {
                  case 'stairs_up':
                    return <Entity.StairsUp pos={val.pos} key={key} onClick={onClick} />;
                  case 'stairs_up_secret':
                    return <Entity.StairsUp pos={val.pos} isSecret key={key} onClick={onClick} />;
                  case 'stairs_down':
                    return <Entity.StairsDown pos={val.pos} key={key} onClick={onClick} />;
                  case 'stairs_down_secret':
                    return <Entity.StairsDown pos={val.pos} isSecret key={key} onClick={onClick} />;
                  default:
                    return '';
                }
              })}
            {markerPos && <PlayerMarker pos={markerPos} />}
            {/* eslint-disable-next-line */}
            {background && <span dangerouslySetInnerHTML={{ __html: background }} />}
          </div>
        </div>
      </td>
    );
  }
}

export default Tile;
