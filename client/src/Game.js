import React, {Component} from 'react';

import './Game.css';

import {connect} from 'react-redux';
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import {Redirect} from 'react-router';

import {syncLoginStatus} from './actions/authActions'
import openSocket from 'socket.io-client';
import userIcon from './user_icon.png';

let socket;

// ============================= CHAT BAR ================================

class ChatBar extends Component {
  constructor (props) {
    super(props);
    this.state = {messages: [], textInput: ''};

    this.onTextChange = this.onTextChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.scrollToBottom();
    socket.on('message', function(data) {
      this.setState((prevState) => {
        return {messages: prevState.messages.concat(data)};
      });
    }.bind(this));
  }

  scrollToBottom() {
    this.refs.messagesEnd.scrollIntoView({ behavior: "smooth" });
  }

  componentDidUpdate() {
    this.scrollToBottom();
}

  onTextChange(event) {
    this.setState({textInput: event.target.value});
  }

  handleSubmit(event) {
    event.preventDefault();
    socket.emit('message', {sender: this.props.username, message: this.state.textInput});
    this.setState({textInput: ''});
  }

  render () {
    return (
      <div className="sidebar">
        <div className="chat-header"> 
          <h3> Chatroom </h3>
        </div>
        <div className="chat-body">
          {
            this.state.messages.map(function(item, index) {
              if (item.sender === "") {
                return <div key={index}> <i className='text-muted'> {item.message} </i> </div>
              } else {
                return <div key={index}> <b>{item.sender}: </b> {item.message} </div>
              }
            })
          }
          <div ref='messagesEnd'/>
        </div>
        <div className="chat-input">
        <Form onSubmit={this.handleSubmit}>
          <Form.Group controlId="formMessage">
            <Form.Control type="text" placeholder="type your message..." value={this.state.textInput} onChange={this.onTextChange}/> 
          </Form.Group>

        </Form>
        </div>
      </div>
    )
  }
}


// =========================== GAME LOBBY ============================

class GameLobby extends Component {
  render () {
    var actionDiv;
    if (this.props.isHost) {
      actionDiv = <div>
                    <h5 className='text-muted'> To invite a user to this room, share this page's link. </h5>
                    <br/>
                    <Button variant= "primary" disabled={this.props.currentNumPlayers<=1} onClick= {this.props.handleClick}>
                      Start Game
                    </Button>

                  </div>
    } else {
      actionDiv = <h3 className='text-muted'> waiting for host to start game... </h3>
    }
    return (
      <div className="game-lobby">
        <center>
          <h1> Players in room: </h1>
          <h1 className="display-1 num-players"> {this.props.currentNumPlayers}</h1>
          {actionDiv}
        </center>
      </div>
    )
  }
}

class ErrorScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {redirect: false};
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.setState({redirect: true});
  }

  render () {
    if (this.state.redirect) {
      return <Redirect to='/'/>;
    }
    return (
      <div className="game-lobby-error">
        <center>
          <h1 className=""> Error! </h1>
          <h3 className='text-muted'> {this.props.errorMessage} </h3>
          <br/>
          <Button variant="primary" onClick={this.handleClick}>
            Return Home
          </Button>
        </center>
      </div>
    )
  }
}

class WizardsHeader extends Component {
  render () {
    return (
      <header className="wizards-header">
        <center>
          <h2 className="display-2"> Wizards.io </h2>
        </center>
      </header>
    )
  }
}

// ============================ GAME PLAY ============================

class Player extends Component {
  render() {
    return (
      <div className="player" style={{position: "absolute", top:this.props.topOffset-92, left:this.props.leftOffset-63}}>
        <img className="player-icon" alt={this.props.username} src={userIcon}/>
        <h5 className="player-name"> <center> {this.props.username} </center> </h5>
        <div className="player-info"> <center> bid: {this.props.bid}, made: {this.props.made} </center> </div>
      </div>
    )
  }
}

class Card extends Component {
  render() {
    var overlayDiv = <div/>
    if (this.props.isClickable) {
      overlayDiv = <div className="card-overlay" onClick= {() => this.props.handlePlay()}/>
    }
    return (
      <div className="card-container">
        <img className="card" alt='' src={require('../public/cards2/' + this.props.val + '.png')}/>
        {overlayDiv}
      </div>
    )
  }
}


class PlayedCard extends Component {
  render() {
    var card = <div/>;
    if (this.props.val !== '') {
      card = <img className="played-card" alt='' src={require('../public/cards2/' + this.props.val + '.png')}/>
    }
    return (
      <div className="played-card-container"
           style={{position: "absolute", top:this.props.topOffset-39, left:this.props.leftOffset-26}}>
        {card}
      </div>
    )
  }
}

class PlayAction extends Component {
  render () {
    return (
      <div className="play-action">
        <h5 className="player-name"> <center> {this.props.username} </center> </h5>
        <div className="player-info"> <center> bid: {this.props.bid}, made: {this.props.made} </center> </div>
        <div className="cards">
        {
          this.props.hand.map(function(item, index) {
            var handleClick = function () {};
            var isClickable = false;
            if (this.props.playOptions.includes(item)) {
              handleClick = () => {this.props.handlePlay(item)};
              isClickable = true;
            }
            return <Card val={item} key={item} handlePlay={handleClick} isClickable={isClickable}/>;
          }.bind(this))
        }
        </div>
      </div>
    )
  }
}

class BidAction extends Component {
  render () {
    return (
      <div className="table-center">
        <center>
        <h3 className="action-title"> Your turn to bid: </h3>
        <div className="bid-options">
        {
          this.props.bidOptions.map((item, index) => (
            <button
              type = "button"
              className = "btn btn-light"
              key = {index}
              onClick= {() => this.props.handleBid(item)}
            >
            {item}
            </button>
          ))
        }
        </div>
        </center>
      </div>
    )
  }
}

function WaitingText(props) {
  var textDiv = <h5 className="text-dark"> <center> {props.text} </center> </h5>
  if (props.waiting) {
    textDiv = <h5 className="text-muted"> <center> {props.text} </center> </h5>
  }
  return (
    <div className="table-center">
      {textDiv}
    </div>
  )
}

function YourTurnText(props) {
  return (
    <div className="table-center">
      <h5 className="your-turn-text"> <center> Choose a card below to play: </center> </h5>
    </div>
  )
}

class GameOverModal extends Component {
  constructor(props) {
    super(props);
    this.state = {show: false, redirect: false};
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
  }

  hide () {
    this.setState({redirect: true});
  }

  show () {
    this.setState({show: true});
  }

  render () {
    if (this.state.redirect) {
      return <Redirect to={'/'} />
    }
    var winnerText;
    if (this.props.winners.length === 1) {
      winnerText = this.props.winners[0];
    } else {
      winnerText = this.props.winners.slice(0, this.props.winners.length-1).join(', ')
                   + 'and ' + this.props.winners[this.props.winners.length-1];
    }
    return (
      <div>
      <Modal show={this.state.show} onHide={this.hide}>
        <Modal.Header closeButton>
          <Modal.Title> Game Over </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <center>
          <h3 className='text-primary'> Congratulations, {winnerText}! </h3>
          <h5> Scores </h5>
          {
            Object.keys(this.props.scores).map(key => (
              <div key={key}> <b> {key}: </b> {this.props.scores[key]} </div>
            ))
          }
          <br/>
            <Button variant='primary' onClick={this.hide}>
              Return Home
            </Button>
          </center>
        </Modal.Body>
      </Modal>
      </div>
    );
  }
}


class GameHeader extends Component {
  render () {
    var trumpSuitWords = {'d': 'Diamonds',
                          'c': 'Clubs',
                          'h': 'Hearts',
                          's': 'Spades',
                          'NT': 'No Trump'};
    var trumpSuitDiv = <p> Trump Suit: {trumpSuitWords[this.props.trumpSuit]} </p>;
    if (['d', 'c', 'h', 's'].includes(this.props.trumpSuit)) {
      trumpSuitDiv = <p> Trump Suit: {trumpSuitWords[this.props.trumpSuit]}
                       <img className="suit-icon" alt='' src={require('../public/cards2/' + this.props.trumpSuit + '.png')}/>
                     </p>;
    }
    return (
      <div>
        <div className='left-header'>
          <h3> Round {this.props.round} </h3>
          {trumpSuitDiv}
        </div>
        <div className='right-header'>
          <h3> Scores </h3>
          {
            Object.keys(this.props.scores).map(key => (
              <div key={key}> <h5 className='username-text'> {key}: </h5> {this.props.scores[key]} </div>
            ))
          }
        </div>
      </div>
    )
  }
}

class GamePlay extends Component {
  constructor(props) {
    super(props);
    this.state = {hand: [],
                  roundNumber: 1,
                  trumpSuit: '',
                  players: [],
                  tableHeight: 1,
                  tableWidth: 1,
                  bid: {},
                  made: {},
                  played: {},
                  scores: {},
                  yourTurnBid: false,
                  yourTurnPlay: false,
                  waitingText: '',
                  waiting: false,
                  playOptions: [],
                  winners: []}

    this.updateTableDimensions = this.updateTableDimensions.bind(this);
    this.handleBid = this.handleBid.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
  }

  componentDidMount() {
    this.updateTableDimensions();
    window.addEventListener('resize', this.updateTableDimensions);

    // deal and game start
    socket.on('deal', function(data) {
      var made = {};
      var bid = {};
      var played = {};
      var scores = {};
      data.players.forEach(function(item) {
        made[item] = 0;
        bid[item] = 'N/A';
        played[item] = '';
        scores[item] = 0;
      })
      var idx = data.players.indexOf(this.props.username);
      var playerDisplayOrder = data.players.slice(idx, ).concat(data.players.slice(0, idx));
      this.setState({hand: data.hand,
                     trumpSuit: data.trumpSuit,
                     players: playerDisplayOrder,
                     round: data.hand.length,
                     made: made,
                     bid: bid,
                     played: played})
      if (data.hand.length === 1) {
        this.setState({scores: scores})
      }

    }.bind(this));
    socket.emit('gameStart');

    // receiving action requests
    socket.on('requestBid', function(data) {
      this.setState({yourTurnBid: true,
                     bidOptions: data});
    }.bind(this));
    socket.on('requestPlay', function(data) {
      this.setState({yourTurnPlay: true,
                     playOptions: data});
    }.bind(this));

    // receiving waiting notifications
    socket.on('waiting', function(data) {
      this.setState({waitingText: 'Waiting for ' + data.player + ' to ' + data.type + '...',
                     waiting: true})
    }.bind(this));

    // receivng successful actions
    socket.on('bid', function(data) {
      this.setState(prevState => ({
        bid: {
          ...prevState.bid,
          [data.player]: data.value
        }
      }));
    }.bind(this));

    socket.on('play', function(data) {
      this.setState(prevState => ({
        played: {
          ...prevState.played,
          [data.player]: data.value
        }
      }))
      if (data.player === this.props.username) {
        this.setState(function(prevState) {
          var handCopy = prevState.hand.slice();
          handCopy.splice(handCopy.indexOf(data.value), 1);
          return {hand:handCopy};
        })
      }
    }.bind(this));

    socket.on('winTrick', function(data) {
      this.setState({waitingText: data.player + ' won the trick!',
                     waiting: false});
      this.setState(prevState => ({
        made: {
          ...prevState.made,
          [data.player]: prevState.made[data.player] + 1
        }
      }));
    }.bind(this));

    socket.on('clearTable', function(data) {
      var played = {}
      this.state.players.forEach(function(item) {
        played[item] = '';
      })
      this.setState({played: played});
    }.bind(this));

    socket.on('roundEnd', function(data) {
      this.setState({scores: data.scores});
    }.bind(this));

    socket.on('gameOver', function(data) {
      this.setState({scores: data.scores, winners: data.winners});
      this.refs.gameOverModal.show();
    }.bind(this));
  }

  handleBid(value) {
    this.setState({yourTurnBid: false,
                   waitingText: ''});
    socket.emit('bid', value);
  }

  handlePlay(value) {
    this.setState({yourTurnPlay: false,
                   playOptions: [],
                   waitingText: ''});
    socket.emit('play', value);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateTableDimensions);
  }

  updateTableDimensions() {
    this.setState({tableHeight: this.refs.table.clientHeight,
                   tableWidth: this.refs.table.clientWidth})
  }

  calculateTablePosition(k) {
    var x = this.state.tableWidth/2*Math.sin(2*k*Math.PI/this.state.players.length);
    var y = -this.state.tableHeight/2*Math.cos(2*k*Math.PI/this.state.players.length);
    return [x, y];
  }

  calculatePlayerPosition(k) {
    var h = this.state.tableHeight;
    var w = this.state.tableWidth;
    var [x, y] = this.calculateTablePosition(k);
    var minR = Math.min(h/2, w/2);
    x = x*(minR+95)/minR;
    y = y*(minR+95)/minR;
    return [x+w/2, h/2-y];
  }

  calculateCardPosition(k) {
    var h = this.state.tableHeight;
    var w = this.state.tableWidth;
    var [x, y] = this.calculateTablePosition(k);
    var minR = Math.min(h/2, w/2);
    x = x*(minR-55)/minR;
    y = y*(minR-55)/minR;
    return [x+w/2, h/2-y];
  }

  render () {
    // playerOffsets doesn't include yourself
    var playerOffsets = this.state.players.map(function(item, index) {
      return this.calculatePlayerPosition(this.state.players.length - index);
    }.bind(this)).slice(1,);
    // cardOffsets includes yourself
    var cardOffsets = this.state.players.map(function(item, index) {
      return this.calculateCardPosition(this.state.players.length - index);
    }.bind(this));

    var tableCenterDisplay = <div/>;
    if (this.state.yourTurnBid) {
      tableCenterDisplay = <BidAction bidOptions={this.state.bidOptions} handleBid={this.handleBid} />;
    } else if (this.state.yourTurnPlay) {
      tableCenterDisplay = <YourTurnText/>;
    } else {
      tableCenterDisplay = <WaitingText text={this.state.waitingText} waiting={this.state.waiting}/>;
    }
    return (
      <div>
        <GameOverModal ref="gameOverModal" scores={this.state.scores} winners={this.state.winners} {...this.props}/>
        <GameHeader round={this.state.round} trumpSuit={this.state.trumpSuit} scores={this.state.scores} {...this.props}/>
        <div className="table" ref="table">
        {
          playerOffsets.map((item, index) => (
            <Player key={index+1} username={this.state.players[index+1]}
                    bid={this.state.bid[this.state.players[index+1]]}
                    made={this.state.made[this.state.players[index+1]]}
                    leftOffset={item[0]} topOffset={item[1]}/>
          ))
        }
        {
          cardOffsets.map((item, index) => (
            <PlayedCard key={index} val={this.state.played[this.state.players[index]]}
                        leftOffset={item[0]} topOffset={item[1]}/>
          ))
        }
        </div>
        <PlayAction bid={this.state.bid[this.props.username]}
                    made={this.state.made[this.props.username]}
                    hand={this.state.hand}
                    playOptions={this.state.playOptions}
                    handlePlay={this.handlePlay}
                    {...this.props}/>
        {tableCenterDisplay}
      </div>
    )
  }
}

// ======================= GAME WIDGET =======================
class DisconnectModal extends Component {
  constructor(props) {
    super(props);
    this.state = {show: false, redirect: false};
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
  }

  hide () {
    this.setState({redirect: true});
  }

  show () {
    this.setState({show: true});
  }

  render () {
    if (this.state.redirect) {
      return <Redirect to={'/'} />
    }
    return (
      <div>
      <Modal show={this.state.show} onHide={this.hide}>
        <Modal.Header closeButton>
          <Modal.Title> Disconnected </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          You have been disconnected from this room because a player in your room lost connection.
          <br/>
          <br/>
          <center>
            <Button variant='primary' onClick={this.hide}>
              Return Home
            </Button>
          </center>
        </Modal.Body>
      </Modal>
      </div>
    );
  }
}

class Game extends Component {
  constructor (props) {
    super(props);
    if (process.env.NODE_ENV === 'production') {
      socket = openSocket(window.location.hostname);
    } else {
      socket = openSocket('http://localhost:3001');
    }
    this.state = {joinFail: false,
                  joinErrorMessage: '',
                  gameStarted: false,
                  currentNumPlayers: 0,
                  totalNumPlayers: 0,
                  hand: [],
                  playHistory: [],
                  bidOptions: [],
                  isHost: false}
  }

  componentDidMount() {
    const { gameid } = this.props.match.params;
    socket.emit('joinGame', {username: this.props.username, gameid: gameid});
    socket.on('joinFail', function(data) {
      this.setState({joinFail: true,
                     joinErrorMessage: data});
    }.bind(this));
    socket.on('host', function(data) {
      this.setState({isHost: true});
    }.bind(this));
    socket.on('currentNumPlayers', function(data) {
      this.setState({currentNumPlayers: data});
    }.bind(this));
    socket.on('gameStart', function(data) {
      this.setState({gameStarted:true});
    }.bind(this));
    socket.on('roomDisconnecting', function() {
      this.refs.disconnectModal.show();
    }.bind(this));
  }

  handleStartGame() {
    socket.emit('startGame');
  }

  render () {
    let display;
    var header = <WizardsHeader/>;
    if (this.state.joinFail) {
      display = <ErrorScreen errorMessage={this.state.joinErrorMessage} {...this.props}/>;
    } else if (this.state.gameStarted) {
      display = <GamePlay {...this.props}/>;
      header = <div/>;
    }
    else {
      display = <GameLobby currentNumPlayers={this.state.currentNumPlayers} handleClick={this.handleStartGame} isHost={this.state.isHost} {...this.props}/>
    }
    return (
      <div>
        <ChatBar {...this.props}/>
        <section className="main">
          {header}
          <div className="main-gameplay">
            {display}
          </div>
        </section>
        <DisconnectModal ref="disconnectModal" {...this.props}/>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    username: state.username,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    syncLoginStatus: () => dispatch(syncLoginStatus()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Game);