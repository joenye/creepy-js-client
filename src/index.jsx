import './index.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import App from './components/App/App';
import configureStore from './redux/configureStore';

const store = configureStore();

// Render last
ReactDOM.render(
  <Provider store={store}>
    <App class="root" />
  </Provider>,
  document.getElementById('root'),
);
