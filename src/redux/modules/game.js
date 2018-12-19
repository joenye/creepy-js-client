import _ from 'lodash'
import { call, select, delay, put, takeEvery } from 'redux-saga/effects'

import { emitJson } from '../../network/socket/api.js'
import Position, {
  northOf,
  eastOf,
  southOf,
  westOf
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

const getDefaultState = () => {
  const height = 10
  const width = 10 // TODO: Dynamically grow structure
  const initialPos = Position(2, 3, 0)

  let tiles = getInitialTiles(width, height, initialPos)
  tiles = updateVisibilities(tiles, initialPos, initialPos)

  return {
    errors: null,
    clickPos: { pageX: 0, pageY: 0 },
    lastErrorClickPos: { pageX: 0, pageY: 0 },
    tiles: tiles,
    clientPos: initialPos
  }
}

const getInitialTiles = (width, height, initialPos) => {
  let tiles = PositionGrid(width, height)
  tiles = updateGridProps(tiles, {
    isLoading: false,
    visibility: TileVisibility.HIDDEN
  })
  tiles = updatePropsAt(tiles, initialPos, {
    rotation: 0,
    isLoading: false,
    visibility: TileVisibility.CURRENT
  })

  return tiles
}

const refreshTiles = (tiles, serverTiles, clientPos, clientOffset) => {
  for (let floor in serverTiles) {
    for (let serverTile of serverTiles[floor]) {
      const pos = serverToClientPos(serverTile.position, clientOffset)
      const visibility = _.isEqual(pos, clientPos) ? TileVisibility.CURRENT : TileVisibility.VISITED
      tiles = updatePropsAt(tiles, pos, {
        background: serverTile.background,
        visibility: visibility
      })
    }
  }
  return tiles
}

const updateVisibilities = (tiles, clientPos, targetPos) => {
  const directions = [northOf, eastOf, southOf, westOf]
  for (const direction of directions) {
    const clientPosOffset = direction(clientPos)
    tiles = updatePropsAt(tiles, clientPosOffset, {
      isCandidate: false
    })
    const targetPosOffset = direction(targetPos)
    tiles = updatePropsAt(tiles, targetPosOffset, {
      isCandidate: true
    })
  }

  tiles = updatePropsAt(tiles, clientPos, {
    visibility: TileVisibility.VISITED
  })
  tiles = updatePropsAt(tiles, targetPos, {
    visibility: TileVisibility.CURRENT
  })

  return tiles
}

const serverToClientPos = (serverPos, clientOffset) => (
  Position(
    serverPos.x + clientOffset.x,
    serverPos.y + clientOffset.y,
    serverPos.z + clientOffset.z
  )
)

const clientToServerPos = (clientPos, clientOffset) => (
  Position(
    clientPos.x - clientOffset.x,
    clientPos.y - clientOffset.y,
    clientPos.z - clientOffset.z
  )
)

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Reducer
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

export default function reducer (state = getDefaultState(), action) {
  let tiles
  let targetPos
  switch (action.type) {
    case REFRESH_ALL_SUCCESS:
      const clientOffset = Position(
        state.clientPos.x - action.serverPos.x,
        state.clientPos.y - action.serverPos.y,
        state.clientPos.z - action.serverPos.z
      )
      tiles = state.tiles.slice()
      tiles = refreshTiles(tiles, action.serverTiles, state.clientPos, clientOffset)
      return {
        ...state,
        tiles: tiles,
        clientOffset: clientOffset
      }
    case RECEIVE_CLICK:
      return {
        ...state,
        clickPos: action.clickPos
      }
    case NAVIGATE_REQUEST:
      tiles = state.tiles.slice()
      tiles = updatePropsAt(tiles, action.targetPos, {
        isLoading: true
      })
      return {
        ...state,
        tiles: tiles
      }
    case NAVIGATE_ERROR:
      targetPos = serverToClientPos(action.targetPos, state.clientOffset)
      tiles = state.tiles.slice()
      tiles = updatePropsAt(tiles, targetPos, {
        isLoading: false
      })
      return {
        ...state,
        tiles: tiles,
        errors: action.errors
      }
    case NAVIGATE_SUCCESS:
      targetPos = serverToClientPos(action.targetPos, state.clientOffset)
      tiles = state.tiles.slice()
      tiles = updateVisibilities(tiles, state.clientPos, targetPos)

      const rotation = getPropsAt(tiles, targetPos).rotation
      tiles = updatePropsAt(tiles, targetPos, {
        isLoading: false,
        background: action.targetTile.background,
        rotation: rotation != null ? rotation : _.random(-1.8, 1.5, true)
      })
      return {
        ...state,
        tiles: tiles,
        clientPos: targetPos
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
      tiles = state.tiles.slice()
      tiles = updatePropsAt(tiles, action.targetPos, {
        isFocused: true
      })
      return {
        ...state,
        tiles
      }
    case CLEAR_FOCUS_TILE:
      tiles = state.tiles.slice()
      tiles = updatePropsAt(tiles, action.targetPos, {
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

function * onFocusTile (seconds, focusCurrent = false, action) {
  const clientPos = yield select((state) => state.game.clientPos)
  const targetPos = focusCurrent ? clientPos : action.targetPos
  yield put(focusTile(targetPos))
  yield delay(seconds * 1000)
  yield put(clearFocusTile(targetPos))
}

export const sagas = [
  function * watchActions () {
    yield takeEvery(REFRESH_ALL_REQUEST, onRefreshAllRequest)
    yield takeEvery(REFRESH_ALL_REQUEST, onFocusTile, 0.5, true)
    yield takeEvery(NAVIGATE_REQUEST, onNavigateRequest)
    yield takeEvery(NAVIGATE_SUCCESS, onFocusTile, 0.5)
  },
  function * watchErrors () {
    yield takeEvery(NAVIGATE_ERROR, onShowErrors, 2)
    yield takeEvery(NAVIGATE_ERROR, onFocusTile, 0.5, true)
  }
]
