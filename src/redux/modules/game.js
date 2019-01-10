import _ from 'lodash'
import { call, select, delay, put, takeEvery } from 'redux-saga/effects'

import { emitJson } from '../../network/socket/api.js'
import Position, {
  northOf,
  eastOf,
  southOf,
  westOf,
  upOf,
  downOf
} from '../../utils/position.js'
import PositionGrid, {
  getPropsAt,
  updateGridProps,
  updatePropsAt
} from '../../utils/positionGrid.js'
import { TileVisibility } from '../../components/Tile/Tile.js'

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Actions
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

const RECEIVE_CLICK = 'RECEIVE_CLICK'

const NAVIGATE_REQUEST = 'NAVIGATE_REQUEST'
const NAVIGATE_SUCCESS = 'NAVIGATE_SUCCESS'
const NAVIGATE_ERROR = 'NAVIGATE_ERROR'

const REFRESH_ALL_REQUEST = 'REFRESH_ALL_REQUEST'
const REFRESH_ALL_SUCCESS = 'REFRESH_ALL_SUCCESS'

const SHOW_ERRORS = 'SHOW_ERRORS'
const CLEAR_ERRORS = 'CLEAR_ERRORS'

const FOCUS_TILE = 'FOCUS_TILE'
const CLEAR_FOCUS_TILE = 'CLEAR_FOCUS_TILE'

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Action creators
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

export const receiveClick = (pageX, pageY) => ({
  type: RECEIVE_CLICK,
  clickPos: { pageX, pageY }
})

export const navigateRequest = (targetPos) => ({
  type: NAVIGATE_REQUEST,
  targetPos: targetPos
})

export const navigateSuccess = (targetPos, targetTile) => ({
  type: NAVIGATE_SUCCESS,
  targetPos: targetPos,
  targetTile: targetTile
})

export const navigateError = (targetPos, errors) => ({
  type: NAVIGATE_ERROR,
  targetPos: targetPos,
  errors: errors
})

export const refreshAllRequest = () => ({
  type: REFRESH_ALL_REQUEST
})

export const refreshAllSuccess = (serverPos, serverTiles) => ({
  type: REFRESH_ALL_SUCCESS,
  serverPos: serverPos,
  serverTiles: serverTiles
})

export const focusTile = (targetPos) => ({
  type: FOCUS_TILE,
  targetPos: targetPos
})

export const clearFocusTile = (targetPos) => ({
  type: CLEAR_FOCUS_TILE,
  targetPos: targetPos
})

export const showErrors = (errors) => ({
  type: SHOW_ERRORS,
  errors: errors
})

export const clearErrors = () => ({
  type: CLEAR_ERRORS
})

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Reducer helpers
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

const MAP_SIZE = 10 // TODO: Dynamically grow structure
const MAP_CENTRE = Position(Math.floor(MAP_SIZE / 2) - 1, Math.floor(MAP_SIZE / 2) - 1, 0)

const getDefaultState = () => {
  let tiles = {} // [z][x][y]
  tiles[0] = getOrCreateFloor(tiles, 0)

  return {
    errors: null,
    clickPos: { pageX: 0, pageY: 0 },
    lastErrorClickPos: { pageX: 0, pageY: 0 },
    tiles: tiles,
    clientPos: MAP_CENTRE,
    prevClientPos: null
  }
}

const getOrCreateFloor = (tiles, floor) => {
  if (!tiles[floor]) {
    tiles[floor] = getInitialTiles()
    tiles[floor] = updateVisibilities(tiles[floor], MAP_CENTRE, MAP_CENTRE)
  }
  return tiles[floor]
}

const getInitialTiles = (width = MAP_SIZE, height = MAP_SIZE, initialPos = MAP_CENTRE) => {
  let tiles = PositionGrid(width, height)
  tiles = updateGridProps(tiles, {
    isLoading: false,
    markerPos: null,
    visibility: TileVisibility.HIDDEN
  })
  tiles = updatePropsAt(tiles, initialPos, {
    rotation: 0,
    isLoading: false
    // visibility: TileVisibility.CURRENT
  })

  return tiles
}

const refreshTiles = (tiles, serverTiles, clientPos, prevClientPos, clientOffset) => {
  for (let floor in serverTiles) {
    for (let serverTile of serverTiles[floor]) {
      const pos = serverToClientPos(serverTile.pos, clientOffset)
      let visibility = TileVisibility.VISITED
      let markerPos = null
      if (_.isEqual({ x: pos.x, y: pos.y }, { x: clientPos.x, y: clientPos.y })) {
        // Current tile
        visibility = TileVisibility.CURRENT
        markerPos = getPlayerMarkerPos(serverTile.exits_pos, clientPos, prevClientPos)
      }
      tiles[floor] = getOrCreateFloor(tiles, floor)
      tiles[floor] = updatePropsAt(tiles[floor], pos, {
        background: serverTile.background,
        entities: serverTile.entities,
        exitsPos: serverTile.exits_pos,
        visibility: visibility,
        markerPos: markerPos
      })
    }
  }
  return tiles
}

const updateVisibilities = (tiles, prevPos, newPos) => {
  const directions = [northOf, eastOf, southOf, westOf]
  for (const direction of directions) {
    const prevPosOffset = direction(prevPos)
    tiles = updatePropsAt(tiles, prevPosOffset, {
      isCandidate: false
    })
    const newPosOffset = direction(newPos)
    tiles = updatePropsAt(tiles, newPosOffset, {
      isCandidate: true
    })
  }

  tiles = updatePropsAt(tiles, prevPos, {
    visibility: TileVisibility.VISITED,
    isCandidate: !_.isEqual([prevPos.x, prevPos.y], [newPos.x, newPos.y])
  })
  tiles = updatePropsAt(tiles, newPos, {
    visibility: TileVisibility.CURRENT
  })

  return tiles
}

const getPlayerMarkerPos = (exitsPos, currentPos, prevPos) => {
  if (!prevPos) {
    // Starting position (or we refreshed)
    return exitsPos['down']
  }
  console.log(currentPos, prevPos)
  // Get direction navigated
  if (_.isEqual(currentPos, northOf(prevPos))) {
    return exitsPos['down']
  } else if (_.isEqual(currentPos, eastOf(prevPos))) {
    return exitsPos['left']
  } else if (_.isEqual(currentPos, southOf(prevPos))) {
    return exitsPos['up']
  } else if (_.isEqual(currentPos, westOf(prevPos))) {
    return exitsPos['right']
  } else if (_.isEqual(currentPos, upOf(prevPos))) {
    return exitsPos['down']
  } else if (_.isEqual(currentPos, downOf(prevPos))) {
    return exitsPos['down']
  } else {
    throw new Error()
  }
}

const getClientOffset = (clientPos, serverPos) => (
  Position(
    clientPos.x - serverPos.x,
    clientPos.y - serverPos.y,
    clientPos.z - serverPos.z
  )
)

const serverToClientPos = (serverPos, clientOffset) => (
  Position(
    serverPos.x + clientOffset.x,
    serverPos.y + clientOffset.y,
    serverPos.z // Always in sync
  )
)

const clientToServerPos = (clientPos, clientOffset) => (
  Position(
    clientPos.x - clientOffset.x,
    clientPos.y - clientOffset.y,
    clientPos.z // Always in sync
  )
)

export const getFloor = (state) => (
  state.clientPos.z - (state.clientOffset ? state.clientOffset.z : 0)
)

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Reducer
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

export default function reducer (state = getDefaultState(), action) {
  let tiles
  let floor
  let targetPos
  let clientOffset
  let markerPos
  let exitsPos
  switch (action.type) {
    case REFRESH_ALL_SUCCESS:
      let clientPos = { ...state.clientPos, z: action.serverPos.z }
      clientOffset = getClientOffset(clientPos, action.serverPos)
      tiles = { ...state.tiles }
      tiles = refreshTiles(tiles, action.serverTiles, state.clientPos, state.prevClientPos, clientOffset)
      return {
        ...state,
        tiles: tiles,
        clientPos: clientPos,
        clientOffset: clientOffset
      }
    case RECEIVE_CLICK:
      return {
        ...state,
        clickPos: action.clickPos
      }
    case NAVIGATE_REQUEST:
      targetPos = action.targetPos
      tiles = { ...state.tiles }
      floor = targetPos.z
      tiles[floor] = getOrCreateFloor(tiles, floor)
      tiles[floor] = updatePropsAt(tiles[floor], targetPos, {
        isLoading: true
      })
      return {
        ...state,
        tiles: tiles
      }
    case NAVIGATE_ERROR:
      targetPos = serverToClientPos(action.targetPos, state.clientOffset)
      tiles = { ...state.tiles }
      floor = targetPos.z
      tiles[floor] = updatePropsAt(tiles[floor], targetPos, {
        isLoading: false
      })
      return {
        ...state,
        tiles: tiles,
        errors: action.errors
      }
    case NAVIGATE_SUCCESS:
      targetPos = serverToClientPos(action.targetPos, state.clientOffset)
      tiles = { ...state.tiles }
      floor = action.targetPos.z
      exitsPos = action.targetTile.exits_pos
      tiles[floor] = updateVisibilities(tiles[floor], state.clientPos, targetPos)
      markerPos = getPlayerMarkerPos(exitsPos, targetPos, state.clientPos)

      const rotation = getPropsAt(tiles[floor], targetPos).rotation
      tiles[floor] = updatePropsAt(tiles[floor], targetPos, {
        isLoading: false,
        background: action.targetTile.background,
        entities: action.targetTile.entities,
        exitsPos: exitsPos,
        markerPos: markerPos,
        rotation: rotation != null ? rotation : _.random(-1.8, 1.5, true)
      })
      tiles[floor] = updatePropsAt(tiles[floor], state.clientPos, {
        markerPos: null
      })
      return {
        ...state,
        tiles: tiles,
        clientPos: targetPos,
        prevClientPos: state.clientPos
      }
    case SHOW_ERRORS:
      return {
        ...state,
        errors: action.errors,
        lastErrorClickPos: state.clickPos
      }
    case CLEAR_ERRORS:
      return {
        ...state,
        errors: null
      }
    case FOCUS_TILE:
      tiles = { ...state.tiles }
      floor = getFloor(state)
      tiles[floor] = updatePropsAt(tiles[floor], action.targetPos, {
        isFocused: true
      })
      return {
        ...state,
        tiles
      }
    case CLEAR_FOCUS_TILE:
      tiles = { ...state.tiles }
      floor = getFloor(state)
      tiles[floor] = updatePropsAt(tiles[floor], action.targetPos, {
        isFocused: false
      })
      return {
        ...state,
        tiles
      }
    default:
      return state
  }
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Sagas
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

function * onRefreshAllRequest () {
  const payload = {
    action: {
      name: 'refresh_all'
    }
  }
  emitJson(payload) // yield call(..) on this doesn't work
  yield call(console.log, 'Emitted: ', payload)
}

function * onNavigateRequest (action) {
  const clientOffset = yield select((state) => state.game.clientOffset)
  const payload = {
    action: {
      name: 'navigate',
      target_pos: clientToServerPos(action.targetPos, clientOffset)
    }
  }
  emitJson(payload) // yield call(..) on this doesn't work
  yield call(console.log, 'Emitted: ', payload)
}

function * onShowErrors (seconds, action) {
  yield put(showErrors(action.errors))
  yield delay(seconds * 1000)
  yield put(clearErrors())
}

function * onFocusTile (seconds, focusCurrent = false, delayBefore = false, action) {
  const clientPos = yield select((state) => state.game.clientPos)
  const targetPos = focusCurrent ? clientPos : action.targetPos
  if (delayBefore) {
    yield delay(seconds * 1000)
  }
  yield put(focusTile(targetPos))
  yield delay(seconds * 1000)
  yield put(clearFocusTile(targetPos))
}

export const sagas = [
  function * watchActions () {
    yield takeEvery(REFRESH_ALL_REQUEST, onRefreshAllRequest)
    yield takeEvery(REFRESH_ALL_REQUEST, onFocusTile, 0.5, true, true)
    yield takeEvery(NAVIGATE_REQUEST, onNavigateRequest)
    yield takeEvery(NAVIGATE_SUCCESS, onFocusTile, 0.5)
  },
  function * watchErrors () {
    yield takeEvery(NAVIGATE_ERROR, onShowErrors, 2)
    yield takeEvery(NAVIGATE_ERROR, onFocusTile, 0.5, true)
  }
]
