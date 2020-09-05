// Action Creators
import { SET_ALERT, REMOVE_ALERT } from "./types";
import { v4 as uuid } from "uuid";

// setAlert returns a function
// this is feasible because of Thunk
export const setAlert = (msg, alertType, timeout = 5000) => (dispatch) => {
  const id = uuid();
  dispatch({
    type: SET_ALERT,
    payload: { id, msg, alertType },
  });
  setTimeout(() => dispatch({ type: REMOVE_ALERT, payload: id }), timeout);
};
