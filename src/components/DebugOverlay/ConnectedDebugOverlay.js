import { connect } from 'react-redux'

import DebugOverlay from './DebugOverlay.js'

const mapStateToProps = state => ({ game: state.game })

const ConnectedDebugOverlay = connect(
  mapStateToProps
)(DebugOverlay)

export default ConnectedDebugOverlay
