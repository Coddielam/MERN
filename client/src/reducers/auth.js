import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
} from "../actions/types";

const initialState = {
  // will eventually store the token in localStorage
  token: localStorage.getItem("token"),
  // REGISTER_SUCCESS will set isAuthenticated to true
  isAuthenticated: null,
  loading: true,
  // when we make request to the backend at /api/auth
  // we will get the user and put it here
  user: null,
};

export default function (state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case REGISTER_SUCCESS:
    case LOGIN_SUCCESS:
      localStorage.setItem("token", payload.token);
      return {
        ...state,
        // payload contains the jwt token
        ...payload,
        isAuthenticated: true,
        loading: false,
      };

    case REGISTER_FAIL:
    case AUTH_ERROR:
    case LOGIN_FAIL:
    case LOGOUT:
      // remove anything in the localStorage token spot
      localStorage.removeItem("token");
      return {
        ...state,
        // setting the value to null
        token: null,
        loading: false,
        isAuthenticated: false,
      };

    case USER_LOADED:
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: payload,
      };

    default:
      return state;
  }
}
