import { createAction, props } from "@ngrx/store";
import { Annotation } from "src/app/models/Annotations";
import { Channel } from "src/app/models/Channel";
import { Course } from "src/app/models/Course";
import { Reply } from "src/app/models/Reply";
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
    '[Course] Tgas Successfully Loaded',
    props<{tags: Tag[], tagsFor: string}>()
);

export const LoadTagsFail = createAction(
    '[Course] Failed To Load Tags For Selected Channel',
    props<{error: string}>()
);

export const selectTag = createAction(
    '[Course] Tag Selected Value',
    props<{tagSelected: boolean}>()
);

export const loadAnnotationsForSelectedTag = createAction(
    '[Course] Load All Annotations for Selected Tag',
    props<{tagSelected: boolean, selectedTagName: string, courseId: string}>()
);

export const loadAnnotationsForSelectedTagSuccess = createAction(
    '[Course] Load All Annotations for Selected Tag Success',
    props<{annotations: Annotation[]}>()
);

export const loadAnnotationsForSelectedTagFail = createAction(
    '[Course] Failed To Load Annotations For Selected Tag',
    props<{error: string}>()
);

export const updateAnnotationsForSelectedTag = createAction(
    '[Course] Update All Annotations for Selected Tag',
    props<{payload: any}>()
);

export const loadReplies = createAction(
    '[Tag Annotation] Get Replies Action',
    props<{annotations: Annotation[]}>()
);

export const loadRepliesSuccess = createAction(
    '[Tag Annotation] Load Replies Success',
);

export const loadRepliesFail = createAction(
    '[Tag Annotation] Load Replies Fail',
    props<{error: string}>()
);

export const updateAnnotationsWithReplies = createAction(
    '[Tag Annotation] Update Annotations With Replies',
    props<{annotations: Annotation[]}>()
);

export const updateAnnotationsWithRepliesFail = createAction(
    '[Tag Annotation] Update Annotations With Replies Failed',
    props<{error: string}>()
);

export const updateAnnotationsWithRepliesSuccess = createAction(
    '[Tag Annotation] Updated Annotations With Replies Successfully',
    props<{error: string}>()
);

export const postReply = createAction(
    '[Tag Annotation] Post Reply Action',
    props<{ annotation: Annotation, reply: Reply}>()
);

export const postReplySuccess = createAction(
    '[Tag Annotation] Post Reply Success'
);

export const postReplyFail = createAction(
    '[Tag Annotation] Post Reply Fail',
    props<{ error: string }>()
);

export const likeAnnotation = createAction(
    '[Tag Annotation] Like Annotation Action',
    props<{ annotation: Annotation}>()
);

export const likeAnnotationSuccess = createAction(
    '[Tag Annotation] Like Annotation Success'
);

export const likeAnnotationFail = createAction(
    '[Tag Annotation] Like Annotation Fail',
    props<{ error: string }>()
);

export const dislikeAnnotation = createAction(
    '[Tag Annotation] Dislike Annotation Action',
    props<{ annotation: Annotation}>()
);

export const dislikeAnnotationSuccess = createAction(
    '[Tag Annotation] Dislike Annotation Success'
);

export const dislikeAnnotationFail = createAction(
    '[Tag Annotation] Dislike Annotation Fail',
    props<{ error: string }>()
);

export const likeReply = createAction(
    '[Tag Annotation] Like Reply Action',
    props<{ reply: Reply}>()
);

export const likeReplySuccess = createAction(
    '[Tag Annotation] Like Reply Success'
);

export const likeReplyFail = createAction(
    '[Tag Annotation] Like Reply Fail',
    props<{ error: string }>()
);

export const dislikeReply = createAction(
    '[Tag Annotation] Dislike Reply Action',
    props<{ reply: Reply}>()
);

export const dislikeReplySuccess = createAction(
    '[Tag Annotation] Dislike Reply Success'
);

export const dislikeReplyFail = createAction(
    '[Tag Annotation] Dislike Reply Fail',
    props<{ error: string }>()
);

export const deleteReply = createAction(
    '[Tag Annotation] Delete Reply',
    props<{reply: Reply}>()
);

export const deleteReplySuccess = createAction(
    '[Tag Annotation] Reply Deleted Successfully'
);

export const deleteReplyFail = createAction(
    '[Tag Annotation] Failed To Delete The Reply',
    props<{error: string}>()
);

export const editReply = createAction(
    '[Tag Annotation] Edit Reply',
    props<{reply: Reply, updatedReply: string}>()
);

export const editReplySuccess = createAction(
    '[Tag Annotation] Reply Edited Successfully'
);

export const editReplyFail = createAction(
    '[Tag Annotation] Failed To Edit The Reply',
    props<{error: string}>()
);

export const deleteAnnotation = createAction(
    '[Tag Annotation] Delete Annotation',
    props<{annotation: Annotation}>()
);

export const deleteAnnotationSuccess = createAction(
    '[Tag Annotation] Annotation Deleted Successfully'
);

export const deleteAnnotationFail = createAction(
    '[Tag Annotation] Failed To Delete The Annotation',
    props<{error: string}>()
);

export const editAnnotation = createAction(
    '[Tag Annotation] Edit Annotation',
    props<{annotation: Annotation}>()
);

export const editAnnotationSuccess = createAction(
    '[Tag Annotation] Annotation Edited Successfully'
);

export const editAnnotationFail = createAction(
    '[Tag Annotation] Failed To Edit The Annotation',
    props<{error: string}>()
);

