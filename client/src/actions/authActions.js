import {LOGIN_SUCCESS, LOGIN_FAILURE, SIGNUP_FAILURE, CLEAR_ERROR_MESSAGE, LOGOUT} from './types';

export function login(username, password) {
  return dispatch => {
    fetch('/login', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({username: username,
                            password: password})
    }).then(function(response) {
      return response.json();
    }).then(function(res) {
      if (res.username) {
        dispatch({type: LOGIN_SUCCESS, username});
      }
      else {
        const errorMessage = res.errorMessage;
        dispatch({type: LOGIN_FAILURE, errorMessage});
      }
    })
  }
}

export function signup(username, password) {
  return dispatch => {
    fetch('/signup', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({username: username,
                            password: password})
    }).then(function(response) {
      return response.json();
    }).then(function(res) {
      if (res.username) {
        // login the new user
        login(username, password)(dispatch);
      }
      else {
        const errorMessage = res.errorMessage;
        dispatch({type: SIGNUP_FAILURE, errorMessage});
      }
    })
  }
}

export function clearErrorMessage() {
  return {type: CLEAR_ERROR_MESSAGE};
}

export function logout() {
  return dispatch => {
    fetch('/logout', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    }).then(function(response) {
      return response.json();
    }).then(function(res) {
      dispatch({type: LOGOUT});
    })
  }
}