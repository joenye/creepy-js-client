import _ from 'lodash';
import { call, delay, put, select, takeEvery } from 'redux-saga/effects';

import { TileVisibility } from '../../components/Tile/Tile';
import { socket } from '../../network/ws/client';
import Position, { downOf, eastOf, northOf, southOf, upOf, westOf } from '../../utils/position';
import PositionGrid, {
  appendColumn,
  appendRow,
  getPropsAt,
  gridHeight,
  gridWidth,
  insertColumn,
  insertRow,
  updateGridProps,
  updatePropsAt,
} from '../../utils/positionGrid';

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

const getDefaultState = () => {
  return {
    errors: null,
    clickPos: { pageX: 0, pageY: 0 },
    lastErrorClickPos: { pageX: 0, pageY: 0 },
    tiles: {}, // [z][x][y]
    mapDims: {},
    prevClientPos: null,
  };
};

const DEFAULT_TILE_PROPS = {
  isLoading: false,
  markerPos: null,
  visibility: TileVisibility.HIDDEN,
};

const getOrCreateFloor = (tiles, floor, floorDims) => {
  if (!tiles[floor]) {
    tiles[floor] = createFloor(floorDims);
  }
  return tiles[floor];
};

const createFloor = (floorDims) => {
  if (!floorDims) {
    floorDims = { width: 1, height: 1 };
  }
  console.log(floorDims);
  const { width, height } = floorDims;
  let tiles = PositionGrid(width + 2, height + 2);
  tiles = updateGridProps(tiles, DEFAULT_TILE_PROPS);

  return tiles;
};

const resizeFloorIfRequired = (clientPos, floorTiles) => {
  if (clientPos.x === 0) {
    floorTiles = insertColumn(floorTiles, DEFAULT_TILE_PROPS);
  } else if (clientPos.x === gridWidth(floorTiles) - 1) {
    floorTiles = appendColumn(floorTiles, DEFAULT_TILE_PROPS);
  } else if (clientPos.y === 0) {
    floorTiles = insertRow(floorTiles, DEFAULT_TILE_PROPS);
  } else if (clientPos.y === gridHeight(floorTiles) - 1) {
    floorTiles = appendRow(floorTiles, DEFAULT_TILE_PROPS);
  } else {
    // Nothing to do
  }
  return floorTiles;
};

const refreshTiles = (serverTiles, clientPos, mapDims) => {
  const tiles = {};
  Object.keys(serverTiles).forEach((floor) => {
    serverTiles[floor].forEach((serverTile) => {
      let visibility;
      let markerPos;
      const tilePos = serverToClientPos(serverTile.pos, mapDims);
      if (_.isEqual(tilePos, clientPos)) {
        // Current tile
        visibility = TileVisibility.CURRENT;
        markerPos = getPlayerMarkerPos(serverTile.exits_pos, tilePos, tilePos);
      } else {
        // Previously visited tile
        visibility = TileVisibility.VISITED;
      }
      tiles[floor] = getOrCreateFloor(tiles, floor, mapDims[floor]);
      tiles[floor] = updatePropsAt(tiles[floor], tilePos, {
        background: serverTile.background,
        entities: serverTile.entities,
        exitsPos: serverTile.exits_pos,
        markerPos,
        visibility,
      });
      tiles[floor] = updateVisibilities(tiles[floor], clientPos, clientPos);
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
  if (_.isEqual(newPos, prevPos)) {
    // TODO: Pick random *unblocked* exit (requires server to pass whether
    // exists are blocked)
    return _.shuffle(exitsPos)[0];
  }
  throw new Error(`Unsupported newPos=${JSON.stringify(newPos)}, prevPos=${JSON.stringify(prevPos)}`);
};

const computeMapDims = (serverTiles) => {
  // TODO: Consider calculating on server side
  const mapDims = {};
  // eslint-disable-next-line no-shadow, no-restricted-syntax
  for (const [floor, floorTiles] of Object.entries(serverTiles)) {
    const minX = _.minBy(floorTiles, (t) => t.pos.x).pos.x;
    const maxX = _.maxBy(floorTiles, (t) => t.pos.x).pos.x;
    const minY = _.minBy(floorTiles, (t) => t.pos.y).pos.y;
    const maxY = _.maxBy(floorTiles, (t) => t.pos.y).pos.y;

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    mapDims[floor] = { width, height, minX, minY };
  }
  return mapDims;
};

const serverToClientPos = (serverPos, mapDims) => {
  const { x, y, z } = serverPos;
  let floorDims = mapDims[z];
  if (!floorDims) {
    floorDims = { width: 1, height: 1, minX: 0, minY: 0 };
  }
  const { minX, minY } = floorDims;

  return Position(Math.abs(minX) + x + 1, Math.abs(minY) + y + 1, serverPos.z);
};

const clientToServerPos = (clientPos, mapDims) => {
  const { x, y, z } = clientPos;
  let floorDims = mapDims[z];
  if (!floorDims) {
    floorDims = { width: 1, height: 1, minX: 0, minY: 0 };
  }
  const { minX, minY } = floorDims;

  return Position(x - Math.abs(minX) - 1, y - Math.abs(minY) - 1, clientPos.z);
};

export const getFloor = (state) => _.get(state, 'clientPos.z');

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Reducer
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

export function gameReducer(state = getDefaultState(), action) {
  let tiles;
  let floor;
  let targetServerPos;
  let targetClientPos;
  let clientPos;
  let markerPos;
  let exitsPos;
  switch (action.type) {
    case REFRESH_ALL_SUCCESS: {
      const { serverTiles, serverPos } = action;
      const mapDims = computeMapDims(serverTiles);
      clientPos = serverToClientPos(serverPos, mapDims);
      tiles = refreshTiles(serverTiles, clientPos, mapDims);
      return {
        ...state,
        tiles,
        clientPos,
        mapDims,
      };
    }
    case RECEIVE_CLICK: {
      return {
        ...state,
        clickPos: action.clickPos,
      };
    }
    case NAVIGATE_REQUEST: {
      targetClientPos = action.targetPos;
      tiles = { ...state.tiles };
      floor = targetClientPos.z;

      // In case we enter new floor
      console.log(state.mapDims[floor]);
      const floorDims = state.mapDims[floor] || undefined;
      tiles[floor] = getOrCreateFloor(tiles, floor, state.mapDims[floor]);

      tiles[floor] = updatePropsAt(tiles[floor], targetClientPos, {
        isLoading: true,
      });
      return {
        ...state,
        tiles,
      };
    }
    case NAVIGATE_ERROR: {
      targetServerPos = action.targetPos;
      targetClientPos = serverToClientPos(targetServerPos, state.mapDims);
      tiles = { ...state.tiles };
      floor = targetClientPos.z;
      tiles[floor] = updatePropsAt(tiles[floor], targetClientPos, {
        isLoading: false,
      });
      return {
        ...state,
        tiles,
        errors: action.errors,
      };
    }
    case NAVIGATE_SUCCESS: {
      const { mapDims } = state;
      targetServerPos = action.targetPos;
      const newClientPos = serverToClientPos(targetServerPos, mapDims);
      const prevClientPos = state.clientPos;
      tiles = { ...state.tiles };
      floor = action.targetPos.z;

      // Dynamically grow client tile grid if required
      tiles[floor] = resizeFloorIfRequired(newClientPos, tiles[floor], state.mapDims[floor]);
      if (newClientPos.y === 0) {
        newClientPos.y = 1;
        prevClientPos.y = 2;
        mapDims[floor].minY -= 1;
        mapDims[floor].height += 1;
      }
      if (newClientPos.x === 0) {
        newClientPos.x = 1;
        prevClientPos.x = 2;
        mapDims[floor].minX -= 1;
        mapDims[floor].width += 1;
      }

      // Update new tile
      exitsPos = action.targetTile.exits_pos;
      tiles[floor] = updateVisibilities(tiles[floor], prevClientPos, newClientPos);
      markerPos = getPlayerMarkerPos(exitsPos, newClientPos, prevClientPos);
      const { rotation } = getPropsAt(tiles[floor], newClientPos);
      tiles[floor] = updatePropsAt(tiles[floor], newClientPos, {
        isLoading: false,
        background: action.targetTile.background,
        entities: action.targetTile.entities,
        exitsPos,
        markerPos,
        rotation: rotation != null ? rotation : _.random(-1.8, 1.5, true),
      });

      // Clear old tile
      tiles[prevClientPos.z] = updatePropsAt(tiles[newClientPos.z], prevClientPos, {
        markerPos: null,
      });

      return {
        ...state,
        tiles,
        mapDims,
        clientPos: newClientPos,
        prevClientPos,
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
  const { targetPos } = action;
  const serverPos = yield select((state) => clientToServerPos(targetPos, state.game.mapDims));
  const payload = {
    action: {
      name: 'navigate',
      target_pos: serverPos,
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
    // yield takeEvery(REFRESH_ALL_REQUEST, onFocusTile, 0.5, true, true);
    yield takeEvery(REFRESH_ALL_SUCCESS, onFocusTile, 0.5, true, true);
    yield takeEvery(NAVIGATE_REQUEST, onNavigateRequest);
    yield takeEvery(NAVIGATE_SUCCESS, onFocusTile, 0.5);
  },
  function* watchErrors() {
    yield takeEvery(NAVIGATE_ERROR, onShowErrors, 2);
    yield takeEvery(NAVIGATE_ERROR, onFocusTile, 0.5, true);
  },
];
