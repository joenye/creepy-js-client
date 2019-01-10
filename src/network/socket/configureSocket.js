import io from 'socket.io-client'

import { navigateSuccess, navigateError, refreshAllSuccess } from '../../redux/modules/game.js'

const configureSocket = (dispatch) => {
  const socket = io('192.168.0.12:5000', {
    // Prioritise websocket over polling
    transports: ['websocket', 'polling']
  })

  socket.on('json', (event) => {
    console.log('Received: ', event)
    const message = JSON.parse(event.message)

    switch (event.status) {
      case 'NAVIGATE_SUCCESS':
        dispatch(navigateSuccess(message.new_pos, message.new_tile))
        break
      case 'NAVIGATE_ERROR':
        dispatch(navigateError(message.target_pos, message.errors))
        break
      case 'REFRESH_ALL_SUCCESS':
        dispatch(refreshAllSuccess(message.current_pos, message.all_tiles))
        break
      default:
        break
    }
  })

  return socket
}

export default configureSocket
