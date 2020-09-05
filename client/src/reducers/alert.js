import { SET_ALERT, REMOVE_ALERT } from "../actions/types";

const initialState = [];

// reducer function for alert only
export default function (state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case SET_ALERT:
      // makes a copy of the og state and mutate the copied state
      return [...state, payload];
    case REMOVE_ALERT:
      // in this case the payload will be the id of the alert
      return state.filter((alert) => alert.id !== payload);
    default:
      return state;
  }
}
