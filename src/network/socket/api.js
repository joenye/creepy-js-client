import { socket } from '../../index.js'

export const emitJson = (payload) => {
  socket.emit('json', payload)
}
