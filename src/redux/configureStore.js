import { applyMiddleware, combineReducers, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import createSagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';

import { configureListeners } from '../network/ws/listeners';
import { gameReducer, gameSagas } from './modules/game';

const configureStore = () => {
  const rootReducer = combineReducers({
    game: gameReducer,
  });

  const sagas = [...gameSagas];
  const rootSaga = function* () {
    yield all(sagas.map((saga) => saga()));
  };
  const sagaMiddleware = createSagaMiddleware();

  const store = createStore(rootReducer, composeWithDevTools(applyMiddleware(sagaMiddleware)));
  sagaMiddleware.run(rootSaga);

  configureListeners(store.dispatch);
  return store;
};

export default configureStore;
