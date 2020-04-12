import './MessageOverlay.scss';

import React, { Component } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

class MessageOverlay extends Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  componentDidUpdate() {
    const { clickPos } = this.props;

    if (this.ref.current) {
      const width = this.ref.current.offsetWidth;
      const height = this.ref.current.offsetHeight;
      const clickX = clickPos.pageX;
      const clickY = clickPos.pageY;

      const left = `${clickX - width / 2}px`;
      const top = `${clickY - height / 2}px`;

      this.ref.current.style.left = left;
      this.ref.current.style.top = top;
    }
  }

  render() {
    const { errors } = this.props;
    // TODO: Replace with PropTypes for defaultprops
    const errorsToDisplay = errors == null ? [] : errors;

    return (
      <div className="MessageOverlay" ref={this.ref}>
        <TransitionGroup>
          {errorsToDisplay.map((error) => (
            <CSSTransition key={error} classNames="message" timeout={{ enter: 300, exit: 100 }}>
              <div>{error}</div>
            </CSSTransition>
          ))}
        </TransitionGroup>
      </div>
    );
  }
}

export default MessageOverlay;
