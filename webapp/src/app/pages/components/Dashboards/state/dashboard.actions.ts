import { Action } from "@ngrx/store";
import { Indicator } from "src/app/models/Indicator";
export const ADD_INDICATOR = "ADD_INDICATOR";
export class AddIndicator implements Action{
   readonly type: string = ADD_INDICATOR;
   payload: Indicator
}


   