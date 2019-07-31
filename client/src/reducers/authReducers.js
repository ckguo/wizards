import {LOGIN_SUCCESS, LOGIN_FAILURE, USER_INFO, SIGNUP_FAILURE, LOGOUT, CLEAR_ERROR_MESSAGE} from '../actions/types';

const initialState = {
  username: '',
  errorMessage: ''
};

export default function auth(state=initialState, action) {
  switch (action.type) {
    case LOGIN_SUCCESS:
      return {
        ...state,
        username: action.username,
        errorMessage: ''
      };
    case LOGIN_FAILURE:
      return {
        ...state,
        errorMessage: action.errorMessage
      };
    case USER_INFO:
      return {
        ...state,
        username: action.username
      }
    case SIGNUP_FAILURE:
      return {
        ...state,
        errorMessage: action.errorMessage
      };
    case CLEAR_ERROR_MESSAGE:
      return {
        ...state,
        errorMessage: ''
      }
    case LOGOUT:
      return {
        ...state,
        username: ''
      }
    default:
      return state;
  }
};
