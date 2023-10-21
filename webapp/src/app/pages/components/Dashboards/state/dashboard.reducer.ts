
import * as IndicatorActions from "./dashboard.actions"




const initialState = {
 indicators: []
};

export function indicatorReducer(state = initialState, action:IndicatorActions.AddIndicator){
    switch(action.type){
        case IndicatorActions.ADD_INDICATOR:
            return {...state,
            indicators: [...state.indicators, action.payload]};
        default:
            return state;
    }

}