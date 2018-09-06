import React, { Component } from 'react'

import './App.css'

import Game from '../Game/Game.js'

class App extends Component {
  render () {
    return (
      <div className='App'>
        <Game width='5' height='5' />
      </div>
    )
  }
}

export default App
