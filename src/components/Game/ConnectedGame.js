import { connect } from 'react-redux'

import Game from './Game.js'
import { navigateRequest, receiveClick, refreshRequest } from '../../redux/modules/game.js'

const mapStateToProps = (state, ownProps) => ({
  tiles: state.game.tiles
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  onClick: (event, targetPos) => {
    dispatch(receiveClick(event.pageX, event.pageY))
    dispatch(navigateRequest(targetPos))
  },
  onMount: () => {
    dispatch(refreshRequest())
  }
})

const ConnectedGame = connect(
  mapStateToProps,
  mapDispatchToProps
)(Game)

export default ConnectedGame
