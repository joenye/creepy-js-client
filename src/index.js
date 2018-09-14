import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import './styles/index.css'

import App from './components/App/App.js'
import configureStore from './redux/configureStore.js'
import configureSocket from './network/socket/configureSocket.js'

const store = configureStore()

ReactDOM.render(
  <Provider store={store}>
    <App class='root' />
  </Provider>,
  document.getElementById('root')
)

export const socket = configureSocket(store.dispatch)
