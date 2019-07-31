import React, {Component} from 'react';

import './Home.css';
import Button from 'react-bootstrap/Button';
import Jumbotron from 'react-bootstrap/Jumbotron'
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import {Redirect} from 'react-router';

import {login, signup, logout, clearErrorMessage, syncLoginStatus} from './actions/authActions'
import {connect} from 'react-redux';

class LoginModal extends Component {
  constructor(props) {
    super(props);
    this.state = {show: false,
                  username: "",
                  password: "",
                  };
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.onUsernameChange = this.onUsernameChange.bind(this);
    this.onPasswordChange = this.onPasswordChange.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
  }

  hide () {
    this.setState({show: false});
    this.props.clearErrorMessage();
  }

  show () {
    this.setState({show: true});
  }

  onUsernameChange(event) {
    this.setState({username: event.target.value});
  }

  onPasswordChange(event) {
    this.setState({password: event.target.value});
  }

  handleLogin(event) {
    this.props.login(this.state.username, this.state.password);
  }

  render () {
    return (
      <div>
      <Modal show={this.state.show} onHide={this.hide}>
        <Modal.Header closeButton>
          <Modal.Title> Log In </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formUsername">
              <Form.Control type="text" placeholder="username" onChange={this.onUsernameChange}/> 
            </Form.Group>

            <Form.Group controlId="formPassword">
              <Form.Control type="password" placeholder="password" onChange={this.onPasswordChange}/> 

              <Form.Text className="text-danger">
                {this.props.errorMessage}
              </Form.Text>
            </Form.Group>
          </Form>
          <center>
          <Button variant="primary" onClick={this.handleLogin}> Log In </Button>
          </center>
        </Modal.Body>

      </Modal>
      </div>
    );
  }
}

class SignupModal extends Component {
  constructor(props) {
    super(props);
    this.state = {show: false,
                  username: "",
                  password: "",
                  };
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.onUsernameChange = this.onUsernameChange.bind(this);
    this.onPasswordChange = this.onPasswordChange.bind(this);
    this.handleSignup = this.handleSignup.bind(this);

  }

  hide () {
    this.setState({show: false});
    this.props.clearErrorMessage();
  }

  show () {
    this.setState({show: true});
  }

  onUsernameChange(event) {
    this.setState({username: event.target.value});
  }

  onPasswordChange(event) {
    this.setState({password: event.target.value});
  }

  handleSignup(event) {
    this.props.signup(this.state.username, this.state.password);
  }

  render () {
    return (
      <div>
      <Modal show={this.state.show} onHide={this.hide}>
        <Modal.Header closeButton>
          <Modal.Title> Sign Up </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formUsername">
              <Form.Control type="text" placeholder="username" onChange={this.onUsernameChange}/> 
            </Form.Group>

            <Form.Group controlId="formPassword">
              <Form.Control type="password" placeholder="password" onChange={this.onPasswordChange}/> 

              <Form.Text className="text-danger">
                {this.props.errorMessage}
              </Form.Text>
            </Form.Group>
          </Form>
          <center>
          <Button variant="secondary" onClick={this.handleSignup}> Sign Up </Button>
          </center>
        </Modal.Body>

      </Modal>
      </div>
    );
  }
}


class MemberHome extends Component {
  constructor(props) {
    super(props);
    this.handleCreateGame = this.handleCreateGame.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.state = {redirectGameId: ''};
  }

  handleCreateGame(event) {
    fetch('/createGame', {
      method: 'GET'
    }).then(function(res) {
      return res.json();
    }).then(function(info) {
      // this.props.history.push('/game/' + info.gameid);
      this.setState({redirectGameId: info.gameid});
    }.bind(this))
  }

  handleLogout(event) {
    this.props.logout();
  }

  render () {
    if (this.state.redirectGameId !== '') {
      return <Redirect to={'/game/' + this.state.redirectGameId} />
    }
    return (
      <Jumbotron>
        <h1 className="display-1"> Wizards.io </h1>
        <br/>
        <h4>
          Welcome, {this.props.username}!
        </h4>
        <br/>
        <p>
          <Button variant="primary" onClick={this.handleCreateGame}> Create Game </Button>
        </p>
        <p>
          <Button variant="secondary" onClick={this.handleLogout}> Log Out </Button>
        </p>
      </Jumbotron>
    );
  }
}

class GuestHome extends Component {
  constructor(props) {
    super(props);

    this.handleLogin = this.handleLogin.bind(this);
    this.handleSignup = this.handleSignup.bind(this);
  }

  handleLogin(event) {
    this.refs.loginModal.show();
  }

  handleSignup(event) {
    this.refs.signupModal.show();
  }

  render () {
    return (
      <Jumbotron>
        <h1 className="display-1"> Wizards.io </h1>
        <br/>
        <p>
          <Button variant="primary" onClick={this.handleLogin}> Log In </Button>
        </p>
        <LoginModal ref="loginModal" {...this.props}/>
        <p>
          <Button variant="secondary" onClick={this.handleSignup}> Sign Up </Button>
        </p>
        <SignupModal ref="signupModal" {...this.props}/>

      </Jumbotron>
    );
  }
}


class Home extends Component {
  constructor(props) {
    super(props);

    this.props.syncLoginStatus();
  }
  render () {
    let display;
    if (this.props.username !== "") {
      display = <MemberHome {...this.props}/>;
    } else {
      display = <GuestHome {...this.props}/>;
    }
    return (
      <div>
        {display}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    username: state.username,
    errorMessage: state.errorMessage
  };
}

function mapDispatchToProps(dispatch) {
  return {
    login: (username, password) => dispatch(login(username, password)),
    signup: (username, password) => dispatch(signup(username, password)),
    logout: () => dispatch(logout()),
    syncLoginStatus: () => dispatch(syncLoginStatus()),
    clearErrorMessage: () => dispatch(clearErrorMessage())
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);