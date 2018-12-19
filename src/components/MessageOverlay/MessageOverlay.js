import React, { Component } from 'react'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

import './MessageOverlay.css'

class MessageOverlay extends Component {
  constructor (props) {
    super(props)
    this.ref = React.createRef()
  }

  componentDidUpdate () {
    if (this.ref.current) {
      const width = this.ref.current.offsetWidth
      const height = this.ref.current.offsetHeight
      const clickX = this.props.clickPos.pageX
      const clickY = this.props.clickPos.pageY

      const left = (clickX - (width / 2)) + 'px'
      const top = (clickY - (height / 2)) + 'px'

      this.ref.current.style.left = left
      this.ref.current.style.top = top
    }
  }

  render () {
    // TODO: Replace with PropTypes for defaultprops
    const errors = this.props.errors == null ? [] : this.props.errors

    return (
      <div className='MessageOverlay' ref={this.ref}>
        <TransitionGroup>
          {errors.map(
            error =>
              <CSSTransition
                key={error}
                classNames='message'
                timeout={{ enter: 300, exit: 100 }}
              >
                <div>
                  {error}
                </div>
              </CSSTransition>
          )}
        </TransitionGroup>
      </div>
    )
  }
}

export default MessageOverlay
