import { connect } from 'react-redux'

import Game from './Game.js'
import { navigateRequest, receiveClick, refreshAllRequest, getFloor } from '../../redux/modules/game.js'

const mapStateToProps = (state, ownProps) => ({
  // tiles: state.game.tiles[getFloor(state.game)]
  tiles: state.game.tiles
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  onClick: (event, meta) => {
    console.log(meta)
    switch (meta.target) {
      case 'tile':
        dispatch(receiveClick(event.pageX, event.pageY))
        dispatch(navigateRequest(meta.targetPos))
        break
      case 'stairs':
        dispatch(receiveClick(event.pageX, event.pageY))
        dispatch(navigateRequest(meta.targetPos))
        break
      default:
        console.error('Unexpected click event target: ', meta.target)
    }
  },
  onMount: () => {
    dispatch(refreshAllRequest())
  }
})

const ConnectedGame = connect(
  mapStateToProps,
  mapDispatchToProps
)(Game)

export default ConnectedGame
