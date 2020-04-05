import { connect } from 'react-redux';

import MessageOverlay from './MessageOverlay';

const mapStateToProps = (state) => ({
  errors: state.game.errors,
  clickPos: state.game.lastErrorClickPos,
});

const ConnectedMessageOverlay = connect(mapStateToProps)(MessageOverlay);

export default ConnectedMessageOverlay;
