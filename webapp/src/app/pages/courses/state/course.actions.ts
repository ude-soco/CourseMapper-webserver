import { createAction, props } from "@ngrx/store";
import { Channel } from "src/app/models/Channel";
import { Course } from "src/app/models/Course";
import { Tag } from "src/app/models/Tag";
import { Topic } from "src/app/models/Topic";

export const setCurrentCourse = createAction(
    '[Course] Set Current Course value',
    props<{selcetedCourse: Course}>()
);

export const setCurrentTopic = createAction(
    '[Course] Set Current Topic value',
    props<{selcetedTopic: Topic}>()
);

export const setCourseId = createAction(
    '[Course] Set current courseId',
    props<{courseId: string}>()
);

export const toggleChannelSelected = createAction(
    '[Course] Set channel selected boolean value',
    props<{channelSelected: boolean}>()
);

export const SetSelectedChannel = createAction(
    '[Course] Set Current Selected Channel',
    props<{selectedChannel: Channel}>()
);

export const LoadTagsSuccess = createAction(
    '[Course] Tgas Successfully Loaded For Selected Channel',
    props<{tags: Tag[]}>()
);

export const LoadTagsFail = createAction(
    '[Course] Failed To Load Tags For Selected Channel',
    props<{error: string}>()
);