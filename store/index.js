import { createStore } from "redux";
import { createWrapper, HYDRATE } from "next-redux-wrapper";

const initialState = {
  admin: {
    loggedIn: false,
    username: "",
  },
  user: {
    loggedIn: false,
    wallet: "",
    connectedWith: "",
    tokenHave: 0,
  },
};

const ADMIN_LOGIN_SUCCESS = "ADMIN_LOGIN_SUCCESS";
const ADMIN_LOGOUT = "ADMIN_LOGOUT";

const USER_LOGIN_SUCCESS = "USER_LOGIN_SUCCESS";
const USER_LOGOUT = "USER_LOGOUT";

const UPDATE_USER_TOKENHAVE = "UPDATE_USER_TOKENHAVE";

export const adminLoginSuccess = (username) => ({
  type: ADMIN_LOGIN_SUCCESS,
  payload: {
    username,
  },
});

export const userLoginSuccess = (payload) => ({
  type: USER_LOGIN_SUCCESS,
  payload: {
    wallet: payload.wallet,
    connectedWith: payload.connectedWith,
  },
});

export const updateUserTokenHave = (payload) => ({
  type: UPDATE_USER_TOKENHAVE,
  payload: {
    tokenHave: payload.tokenHave,
  },
});

export const adminLogout = () => ({
  type: ADMIN_LOGOUT,
});

export const userLogout = () => ({
  type: USER_LOGOUT,
});

// create your reducer
const reducer = (state = initialState, action) => {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...action.payload };
    case ADMIN_LOGIN_SUCCESS:
      return {
        ...state,
        admin: {
          ...state.admin,
          loggedIn: true,
          username: action.payload.username,
        },
      };
    case ADMIN_LOGOUT:
      return {
        ...state,
        admin: {
          ...state.admin,
          loggedIn: false,
          username: "",
        },
      };
    case USER_LOGIN_SUCCESS:
      return {
        ...state,
        user: {
          ...state.user,
          loggedIn: true,
          wallet: action.payload.wallet,
          connectedWith: action.payload.connectedWith,
        },
      };
    case USER_LOGOUT:
      return {
        ...state,
        user: {
          ...state.user,
          loggedIn: false,
          wallet: "",
        },
      };
    case UPDATE_USER_TOKENHAVE:
      return {
        ...state,
        user: {
          ...state.user,
          tokenHave: action.payload.tokenHave,
        },
      };
    default:
      return state;
  }
};

// create a makeStore function
const makeStore = (context) => createStore(reducer);

// export an assembled wrapper
export const wrapper = createWrapper(makeStore, { debug: true });
