import { createAction, props } from "@ngrx/store";
import { Annotation } from "src/app/models/Annotations";
import { DrawingData } from "src/app/models/Drawing";

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

export const SetVideoDuration = createAction(
    '[Video] Set Video Duration',
    props<{ videoDuration: number}>()
);

export const SetCurrentTime = createAction(
    '[Video] Set Current Time',
    props<{ currentTime: number}>()
);

export const SetIsAnnotationDialogVisible = createAction(
    '[Video] Set Is Annotation Dialog Visible',
    props<{ isAnnotationDialogVisible: boolean}>()
);

export const SetIsAnnotationCreationCanceled = createAction(
    '[Video] Set Is Annotation Creation Canceled',
    props<{ isAnnotationCreationCanceled: boolean}>()
);

export const SetDrawingData = createAction(
    '[Video] Set Drawing Data',
    props<{ drawingData: DrawingData}>()
);

export const SetPinPointPosition = createAction(
    '[Video] Set PinPoint Position',
    props<{ pinpointPosition: [number, number]}>()
);

export const SetActiveAnnotaion = createAction(
    '[Video] Set Active Annotation',
    props<{ activeAnnotation: Annotation}>()
);

export const SetShowAnnotations = createAction(
    '[Video] Set Show Annotations',
    props<{ showAnnotations: boolean}>()
);

export const SetSeekVideo = createAction(
    '[Video] Set Seek Video Time',
    props<{ seekVideo: [number, number]}>()
);

export const VideoCompleted = createAction(
    '[Video] Video Is Completed',
);