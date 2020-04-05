import _ from 'lodash';
import { call, delay, put, select, takeEvery } from 'redux-saga/effects';

import { TileVisibility } from '../../components/Tile/Tile';
import { socket } from '../../network/ws/client';
import Position, { downOf, eastOf, northOf, southOf, upOf, westOf } from '../../utils/position';
import PositionGrid, { getPropsAt, updateGridProps, updatePropsAt } from '../../utils/positionGrid';

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Actions
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

const RECEIVE_CLICK = 'RECEIVE_CLICK';

const NAVIGATE_REQUEST = 'NAVIGATE_REQUEST';
const NAVIGATE_SUCCESS = 'NAVIGATE_SUCCESS';
const NAVIGATE_ERROR = 'NAVIGATE_ERROR';

const EMIT_EVENT = 'EMIT_EVENT';

const REFRESH_ALL_REQUEST = 'REFRESH_ALL_REQUEST';
const REFRESH_ALL_SUCCESS = 'REFRESH_ALL_SUCCESS';

const SHOW_ERRORS = 'SHOW_ERRORS';
const CLEAR_ERRORS = 'CLEAR_ERRORS';

const FOCUS_TILE = 'FOCUS_TILE';
const CLEAR_FOCUS_TILE = 'CLEAR_FOCUS_TILE';

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Action creators
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

export const receiveClick = (pageX, pageY) => ({
  type: RECEIVE_CLICK,
  clickPos: { pageX, pageY },
});

export const navigateRequest = (targetPos) => ({
  type: NAVIGATE_REQUEST,
  targetPos,
});

export const navigateSuccess = (targetPos, targetTile) => ({
  type: NAVIGATE_SUCCESS,
  targetPos,
  targetTile,
});

export const navigateError = (targetPos, errors) => ({
  type: NAVIGATE_ERROR,
  targetPos,
  errors,
});

export const emitEvent = (payload) => ({
  type: EMIT_EVENT,
  payload,
});

export const refreshAllRequest = () => ({
  type: REFRESH_ALL_REQUEST,
});

export const refreshAllSuccess = (serverPos, serverTiles) => ({
  type: REFRESH_ALL_SUCCESS,
  serverPos,
  serverTiles,
});

export const focusTile = (targetPos) => ({
  type: FOCUS_TILE,
  targetPos,
});

export const clearFocusTile = (targetPos) => ({
  type: CLEAR_FOCUS_TILE,
  targetPos,
});

export const showErrors = (errors) => ({
  type: SHOW_ERRORS,
  errors,
});

export const clearErrors = () => ({
  type: CLEAR_ERRORS,
});

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Reducer helpers
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

const MAP_SIZE = 10; // TODO: Dynamically grow structure
const MAP_CENTRE = Position(Math.floor(MAP_SIZE / 2) - 1, Math.floor(MAP_SIZE / 2) - 1, 0);

const getDefaultState = () => {
  const tiles = {}; // [z][x][y]
  tiles[0] = getOrCreateFloor(tiles, 0);

  return {
    errors: null,
    clickPos: { pageX: 0, pageY: 0 },
    lastErrorClickPos: { pageX: 0, pageY: 0 },
    tiles,
    clientPos: MAP_CENTRE,
    prevClientPos: null,
  };
};

const getOrCreateFloor = (tiles, floor) => {
  if (!tiles[floor]) {
    tiles[floor] = getInitialTiles();
    tiles[floor] = updateVisibilities(tiles[floor], MAP_CENTRE, MAP_CENTRE);
  }
  return tiles[floor];
};

const getInitialTiles = (width = MAP_SIZE, height = MAP_SIZE, initialPos = MAP_CENTRE) => {
  let tiles = PositionGrid(width, height);
  tiles = updateGridProps(tiles, {
    isLoading: false,
    markerPos: null,
    visibility: TileVisibility.HIDDEN,
  });
  tiles = updatePropsAt(tiles, initialPos, {
    rotation: 0,
    isLoading: false,
    // visibility: TileVisibility.CURRENT
  });

  return tiles;
};

const refreshTiles = (tiles, serverTiles, clientPos, prevClientPos, clientOffset) => {
  Object.keys(serverTiles).forEach((floor) => {
    serverTiles[floor].forEach((serverTile) => {
      const pos = serverToClientPos(serverTile.pos, clientOffset);
      let visibility = TileVisibility.VISITED;
      let markerPos = null;
      if (_.isEqual({ x: pos.x, y: pos.y }, { x: clientPos.x, y: clientPos.y })) {
        // Current tile
        visibility = TileVisibility.CURRENT;
        markerPos = getPlayerMarkerPos(serverTile.exits_pos, clientPos, prevClientPos);
      }
      tiles[floor] = getOrCreateFloor(tiles, floor);
      tiles[floor] = updatePropsAt(tiles[floor], pos, {
        background: serverTile.background,
        entities: serverTile.entities,
        exitsPos: serverTile.exits_pos,
        visibility,
        markerPos,
      });
    });
  });
  return tiles;
};

const updateVisibilities = (tiles, prevPos, newPos) => {
  const directions = [northOf, eastOf, southOf, westOf];
  directions.forEach((direction) => {
    const prevPosOffset = direction(prevPos);
    tiles = updatePropsAt(tiles, prevPosOffset, {
      isCandidate: false,
    });
    const newPosOffset = direction(newPos);
    tiles = updatePropsAt(tiles, newPosOffset, {
      isCandidate: true,
    });
  });

  tiles = updatePropsAt(tiles, prevPos, {
    visibility: TileVisibility.VISITED,
    isCandidate: !_.isEqual([prevPos.x, prevPos.y], [newPos.x, newPos.y]),
  });
  tiles = updatePropsAt(tiles, newPos, {
    visibility: TileVisibility.CURRENT,
  });

  return tiles;
};

const getPlayerMarkerPos = (exitsPos, newPos, prevPos) => {
  if (!prevPos) {
    // Starting position (or we refreshed)
    return exitsPos.down;
  }
  console.log(newPos, prevPos, exitsPos);
  // Get direction navigated
  if (_.isEqual(newPos, northOf(prevPos))) {
    return exitsPos.down;
  }
  if (_.isEqual(newPos, eastOf(prevPos))) {
    return exitsPos.left;
  }
  if (_.isEqual(newPos, southOf(prevPos))) {
    return exitsPos.up;
  }
  if (_.isEqual(newPos, westOf(prevPos))) {
    return exitsPos.right;
  }
  if (_.isEqual(newPos, upOf(prevPos)) || _.isEqual(newPos, downOf(prevPos))) {
    // TODO: Put next to secret stairs
    return exitsPos.down;
  }
  throw new Error();
};

const getClientOffset = (clientPos, serverPos) =>
  Position(clientPos.x - serverPos.x, clientPos.y - serverPos.y, clientPos.z - serverPos.z);

const serverToClientPos = (serverPos, clientOffset) =>
  Position(
    serverPos.x + clientOffset.x,
    serverPos.y + clientOffset.y,
    serverPos.z, // Always in sync
  );

const clientToServerPos = (clientPos, clientOffset) =>
  Position(
    clientPos.x - clientOffset.x,
    clientPos.y - clientOffset.y,
    clientPos.z, // Always in sync
  );

export const getFloor = (state) => state.clientPos.z - (state.clientOffset ? state.clientOffset.z : 0);

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Reducer
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

export function gameReducer(state = getDefaultState(), action) {
  let tiles;
  let floor;
  let targetPos;
  let clientOffset;
  let markerPos;
  let exitsPos;
  switch (action.type) {
    case REFRESH_ALL_SUCCESS: {
      const clientPos = { ...state.clientPos, z: action.serverPos.z };
      clientOffset = getClientOffset(clientPos, action.serverPos);
      tiles = { ...state.tiles };
      tiles = refreshTiles(tiles, action.serverTiles, state.clientPos, state.prevClientPos, clientOffset);
      return {
        ...state,
        tiles,
        clientPos,
        clientOffset,
      };
    }
    case RECEIVE_CLICK: {
      return {
        ...state,
        clickPos: action.clickPos,
      };
    }
    case NAVIGATE_REQUEST: {
      targetPos = action.targetPos;
      tiles = { ...state.tiles };
      floor = targetPos.z;
      tiles[floor] = getOrCreateFloor(tiles, floor);
      tiles[floor] = updatePropsAt(tiles[floor], targetPos, {
        isLoading: true,
      });
      return {
        ...state,
        tiles,
      };
    }
    case NAVIGATE_ERROR: {
      targetPos = serverToClientPos(action.targetPos, state.clientOffset);
      tiles = { ...state.tiles };
      floor = targetPos.z;
      tiles[floor] = updatePropsAt(tiles[floor], targetPos, {
        isLoading: false,
      });
      return {
        ...state,
        tiles,
        errors: action.errors,
      };
    }
    case NAVIGATE_SUCCESS: {
      targetPos = serverToClientPos(action.targetPos, state.clientOffset);
      tiles = { ...state.tiles };
      floor = action.targetPos.z;
      exitsPos = action.targetTile.exits_pos;
      tiles[floor] = updateVisibilities(tiles[floor], state.clientPos, targetPos);
      markerPos = getPlayerMarkerPos(exitsPos, targetPos, state.clientPos);

      const { rotation } = getPropsAt(tiles[floor], targetPos);
      tiles[floor] = updatePropsAt(tiles[floor], targetPos, {
        isLoading: false,
        background: action.targetTile.background,
        entities: action.targetTile.entities,
        exitsPos,
        markerPos,
        rotation: rotation != null ? rotation : _.random(-1.8, 1.5, true),
      });
      tiles[state.clientPos.z] = updatePropsAt(tiles[state.clientPos.z], state.clientPos, {
        markerPos: null,
      });
      return {
        ...state,
        tiles,
        clientPos: targetPos,
        prevClientPos: state.clientPos,
      };
    }
    case SHOW_ERRORS: {
      return {
        ...state,
        errors: action.errors,
        lastErrorClickPos: state.clickPos,
      };
    }
    case CLEAR_ERRORS: {
      return {
        ...state,
        errors: null,
      };
    }
    case FOCUS_TILE: {
      tiles = { ...state.tiles };
      floor = getFloor(state);
      tiles[floor] = updatePropsAt(tiles[floor], action.targetPos, {
        isFocused: true,
      });
      return {
        ...state,
        tiles,
      };
    }
    case CLEAR_FOCUS_TILE: {
      tiles = { ...state.tiles };
      floor = getFloor(state);
      tiles[floor] = updatePropsAt(tiles[floor], action.targetPos, {
        isFocused: false,
      });
      return {
        ...state,
        tiles,
      };
    }
    default: {
      return state;
    }
  }
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Sagas
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

function* onEmitEvent(action) {
  const { payload } = action;
  socket.emit('json', payload);
  yield call(console.log, 'Emitted event: ', payload);
}

function* onRefreshAllRequest() {
  const payload = {
    action: {
      name: 'refresh_all',
    },
  };
  yield put(emitEvent(payload));
}

function* onNavigateRequest(action) {
  const clientOffset = yield select((state) => state.game.clientOffset);
  const payload = {
    action: {
      name: 'navigate',
      target_pos: clientToServerPos(action.targetPos, clientOffset),
    },
  };
  yield put(emitEvent(payload));
}

function* onShowErrors(seconds, action) {
  yield put(showErrors(action.errors));
  yield delay(seconds * 1000);
  yield put(clearErrors());
}

function* onFocusTile(seconds, focusCurrent = false, delayBefore = false, action) {
  const clientPos = yield select((state) => state.game.clientPos);
  const targetPos = focusCurrent ? clientPos : action.targetPos;
  if (delayBefore) {
    yield delay(seconds * 1000);
  }
  yield put(focusTile(targetPos));
  yield delay(seconds * 1000);
  yield put(clearFocusTile(targetPos));
}

export const gameSagas = [
  function* watchActions() {
    yield takeEvery(EMIT_EVENT, onEmitEvent);
    yield takeEvery(REFRESH_ALL_REQUEST, onRefreshAllRequest);
    yield takeEvery(REFRESH_ALL_REQUEST, onFocusTile, 0.5, true, true);
    yield takeEvery(NAVIGATE_REQUEST, onNavigateRequest);
    yield takeEvery(NAVIGATE_SUCCESS, onFocusTile, 0.5);
  },
  function* watchErrors() {
    yield takeEvery(NAVIGATE_ERROR, onShowErrors, 2);
    yield takeEvery(NAVIGATE_ERROR, onFocusTile, 0.5, true);
  },
];
