import { createAction, props } from "@ngrx/store";

export const setIsBrushSelectionActive = createAction(
    '[Video] Set Is Brush Selection Active',
    props<{ isBrushSelectionActive: boolean}>()
);

export const setIsPinpointSelectionActive = createAction(
    '[Video] Set Is Pinpoint Selection Active',
    props<{ isPinpointSelectionActive: boolean}>()
);

export const PlayVideo = createAction(
    '[Video] Play Video',
);

export const PauseVideo = createAction(
    '[Video] Pause Video',
);