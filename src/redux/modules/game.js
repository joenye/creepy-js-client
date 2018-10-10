import _ from 'lodash'
import { delay } from 'redux-saga'
import { call, put, takeLatest } from 'redux-saga/effects'

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

const SHOW_ERRORS = 'SHOW_ERRORS'
const CLEAR_ERRORS = 'CLEAR_ERRORS'

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

export const navigateSuccess = (newPos, background) => ({
  type: NAVIGATE_SUCCESS,
  newPos: newPos,
  background: background
})

export const navigateError = (targetPos, errors) => ({
  type: NAVIGATE_ERROR,
  targetPos: targetPos,
  errors: errors
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
  const entrancePos = Position(2, 3, 0)

  let tiles = getInitialTiles(width, height, entrancePos)
  tiles = updateVisibilities(tiles, entrancePos, entrancePos)

  return {
    errors: null,
    clickPos: { pageX: 0, pageY: 0 },
    lastErrorClickPos: { pageX: 0, pageY: 0 },
    tiles: tiles,
    currentPos: entrancePos
  }
}

const getInitialTiles = (width, height, entrancePos) => {
  let tiles = PositionGrid(width, height)
  tiles = updateGridProps(tiles, {
    isLoading: false,
    visibility: TileVisibility.HIDDEN
  })
  tiles = updatePropsAt(tiles, entrancePos, {
    rotation: 0,
    isLoading: true,
    visibility: TileVisibility.CURRENT
  })

  return tiles
}

const updateVisibilities = (tiles, currentPos, targetPos) => {
  const directions = [northOf, eastOf, southOf, westOf]

  for (let direction of directions) {
    const currentPosOffset = direction(currentPos)
    tiles = updatePropsAt(tiles, currentPosOffset, {
      isCandidate: false
    })
    const targetPosOffset = direction(targetPos)
    tiles = updatePropsAt(tiles, targetPosOffset, {
      isCandidate: true
    })
  }

  tiles = updatePropsAt(tiles, currentPos, {
    visibility: TileVisibility.VISITED
  })
  tiles = updatePropsAt(tiles, targetPos, {
    visibility: TileVisibility.CURRENT
  })

  return tiles
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Reducer
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

export default function reducer (state = getDefaultState(), action) {
  let tiles
  switch (action.type) {
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
      tiles = state.tiles.slice()
      tiles = updatePropsAt(tiles, action.targetPos, {
        isLoading: false
      })
      return {
        ...state,
        tiles: tiles,
        errors: action.errors
      }
    case NAVIGATE_SUCCESS:
      tiles = state.tiles.slice()
      tiles = updateVisibilities(tiles, state.currentPos, action.newPos)

      const rotation = getPropsAt(tiles, action.newPos).rotation
      tiles = updatePropsAt(tiles, action.newPos, {
        isLoading: false,
        background: action.background,
        rotation: rotation != null ? rotation : _.random(-1.8, 1.5, true)
      })
      return {
        ...state,
        tiles: tiles,
        currentPos: action.newPos
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
    default:
      return state
  }
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Sagas
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

function * onNavigateRequest (action) {
  const payload = {
    action: {
      name: 'navigate',
      target_pos: action.targetPos
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

export const sagas = [
  function * watchActions () {
    yield takeLatest(NAVIGATE_REQUEST, onNavigateRequest)
  },
  function * watchErrors () {
    yield takeLatest(NAVIGATE_ERROR, onShowErrors, 1.6)
  }
]
