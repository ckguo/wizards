import React, {Component} from 'react';

import './NotFound.css';

class NotFound extends Component {
  render () {
    return (
      <div className='not-found'>
        <center>
          <h2 className="display-2 wizards-header"> Wizards.io </h2>
          <div className="game-lobby-error">
              <h1 className=""> Error! </h1>
              <h3 className='text-muted'> Page not found. </h3>
          </div>
        </center>
      </div>
    )
  }
}

export default NotFound;