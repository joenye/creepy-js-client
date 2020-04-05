import { connect } from 'react-redux';

import { getFloor, navigateRequest, receiveClick, refreshAllRequest } from '../../redux/modules/game';
import Game from './Game';

const mapStateToProps = (state, _ownProps) => ({
  // tiles: state.game.floors[getFloor(state.game)] <-- Don't try this - it doesn't work!
  tiles: state.game.tiles,
  currentFloor: getFloor(state.game),
});

const mapDispatchToProps = (dispatch, _ownProps) => ({
  onClick: (event, meta) => {
    console.log(meta);
    switch (meta.target) {
      case 'tile':
        dispatch(receiveClick(event.pageX, event.pageY));
        dispatch(navigateRequest(meta.targetPos));
        break;
      case 'stairs':
        dispatch(receiveClick(event.pageX, event.pageY));
        dispatch(navigateRequest(meta.targetPos));
        break;
      default:
        console.error('Unexpected click event target: ', meta.target);
    }
  },
  onMount: () => {
    dispatch(refreshAllRequest());
  },
});

const ConnectedGame = connect(mapStateToProps, mapDispatchToProps)(Game);

export default ConnectedGame;
