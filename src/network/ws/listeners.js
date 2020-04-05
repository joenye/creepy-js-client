import { navigateError, navigateSuccess, refreshAllSuccess } from '../../redux/modules/game';
import { socket } from './client';

export const configureListeners = (dispatch) => {
  socket.on('json', (event) => {
    const message = JSON.parse(event.message);
    switch (event.status) {
      case 'NAVIGATE_SUCCESS':
        dispatch(navigateSuccess(message.new_pos, message.new_tile));
        break;
      case 'NAVIGATE_ERROR':
        dispatch(navigateError(message.target_pos, message.errors));
        break;
      case 'REFRESH_ALL_SUCCESS':
        dispatch(refreshAllSuccess(message.current_pos, message.all_tiles));
        break;
      default:
        break;
    }
  });
};
