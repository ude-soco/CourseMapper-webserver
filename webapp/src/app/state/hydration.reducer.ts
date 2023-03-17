import { Action, ActionReducer, INIT, UPDATE } from "@ngrx/store";
import { State } from "src/app/state/app.state";

export const hydrationMetaReducer = (reducer: ActionReducer<State>): ActionReducer<State> => {
  return (state, action) => {
    if (action.type === INIT || action.type === UPDATE) {
      const storageValue = localStorage.getItem('state');
      if (storageValue) {
        try {
          const parsedValue = JSON.parse(storageValue);
          return { ...state, ...parsedValue };
        } catch {
          localStorage.removeItem('state');
        }
      }
    }

    const nextState = reducer(state, action);

    // Only update local storage if state has changed
    if (state !== nextState) {
      localStorage.setItem('state', JSON.stringify(nextState));
    }

    return nextState;
  };
};
