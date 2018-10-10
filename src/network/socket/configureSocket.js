import io from 'socket.io-client'

import { navigateSuccess, navigateError } from '../../redux/modules/game.js'

const configureSocket = (dispatch) => {
  const socket = io('https://36fe17d2.eu.ngrok.io', {
    // Prioritise websocket over polling
    transports: ['websocket', 'polling']
  })

  socket.on('json', (event) => {
    console.log('Received: ', event)
    const message = JSON.parse(event.message)

    switch (event.status) {
      case 'NAVIGATE_SUCCESS':
        dispatch(navigateSuccess(message.new_pos, message.background))
        break
      case 'NAVIGATE_ERROR':
        dispatch(navigateError(message.target_pos, message.errors))
        break
      default:
        break
    }
  })

  return socket
}

export default configureSocket
