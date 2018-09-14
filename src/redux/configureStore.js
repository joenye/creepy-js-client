import { all } from 'redux-saga/effects'
import createSagaMiddleware from 'redux-saga'
import { composeWithDevTools } from 'redux-devtools-extension'
import { applyMiddleware, combineReducers, createStore } from 'redux'

import game, { sagas as gameSagas } from '../redux/modules/game.js'

const configureStore = () => {
  const reducers = { game }
  const rootReducer = combineReducers(reducers)

  const sagas = [ ...gameSagas ]
  const rootSaga = function * () {
    yield all(sagas.map(saga => saga()))
  }
  const sagaMiddleware = createSagaMiddleware()

  const store = createStore(
    rootReducer,
    composeWithDevTools(
      applyMiddleware(sagaMiddleware)
    )
  )
  sagaMiddleware.run(rootSaga)

  return store
}

export default configureStore
