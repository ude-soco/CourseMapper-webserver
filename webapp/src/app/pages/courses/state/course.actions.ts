import { createAction, props } from '@ngrx/store';
import { Annotation } from 'src/app/models/Annotations';
import { Channel } from 'src/app/models/Channel';
import { Course } from 'src/app/models/Course';
import { Reply } from 'src/app/models/Reply';
import { Tag } from 'src/app/models/Tag';
import { Topic } from 'src/app/models/Topic';
import { Notification } from 'src/app/models/Notification';
import { BlockingNotifications } from 'src/app/models/BlockingNotification';
export const setCurrentCourse = createAction(
  '[Course] Set Current Course value',
  props<{ selcetedCourse: Course }>()
);

export const setCurrentTopic = createAction(
  '[Course] Set Current Topic value',
  props<{ selcetedTopic: Topic }>()
);

export const setCourseId = createAction(
  '[Course] Set current courseId',
  props<{ courseId: string }>()
);

export const toggleChannelSelected = createAction(
  '[Course] Set channel selected boolean value',
  props<{ channelSelected: boolean }>()
);

export const SetSelectedChannel = createAction(
  '[Course] Set Current Selected Channel',
  props<{ selectedChannel: Channel }>()
);

export const LoadTagsSuccess = createAction(
  '[Course] Tgas Successfully Loaded',
  props<{ tags: Tag[]; tagsFor: string }>()
);

export const LoadTagsFail = createAction(
  '[Course] Failed To Load Tags For Selected Channel',
  props<{ error: string }>()
);

export const selectTag = createAction(
  '[Course] Tag Selected Value',
  props<{ tagSelected: boolean }>()
);

export const loadAnnotationsForSelectedTag = createAction(
  '[Course] Load All Annotations for Selected Tag',
  props<{ tagSelected: boolean; selectedTagName: string; courseId: string }>()
);

export const loadAnnotationsForSelectedTagSuccess = createAction(
  '[Course] Load All Annotations for Selected Tag Success',
  props<{ annotations: Annotation[] }>()
);

export const loadAnnotationsForSelectedTagFail = createAction(
  '[Course] Failed To Load Annotations For Selected Tag',
  props<{ error: string }>()
);

export const updateAnnotationsForSelectedTag = createAction(
  '[Course] Update All Annotations for Selected Tag',
  props<{ payload: any }>()
);

export const loadReplies = createAction(
  '[Tag Annotation] Get Replies Action',
  props<{ annotations: Annotation[] }>()
);

export const loadRepliesSuccess = createAction(
  '[Tag Annotation] Load Replies Success'
);

export const loadRepliesFail = createAction(
  '[Tag Annotation] Load Replies Fail',
  props<{ error: string }>()
);

export const updateAnnotationsWithReplies = createAction(
  '[Tag Annotation] Update Annotations With Replies',
  props<{ annotations: Annotation[] }>()
);

export const updateAnnotationsWithRepliesFail = createAction(
  '[Tag Annotation] Update Annotations With Replies Failed',
  props<{ error: string }>()
);

export const updateAnnotationsWithRepliesSuccess = createAction(
  '[Tag Annotation] Updated Annotations With Replies Successfully',
  props<{ error: string }>()
);

export const postReply = createAction(
  '[Tag Annotation] Post Reply Action',
  props<{ annotation: Annotation; reply: Reply }>()
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
  props<{ annotation: Annotation }>()
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
  props<{ annotation: Annotation }>()
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
  props<{ reply: Reply }>()
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
  props<{ reply: Reply }>()
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
  props<{ reply: Reply }>()
);

export const deleteReplySuccess = createAction(
  '[Tag Annotation] Reply Deleted Successfully'
);

export const deleteReplyFail = createAction(
  '[Tag Annotation] Failed To Delete The Reply',
  props<{ error: string }>()
);

export const editReply = createAction(
  '[Tag Annotation] Edit Reply',
  props<{ reply: Reply; updatedReply: string }>()
);

export const editReplySuccess = createAction(
  '[Tag Annotation] Reply Edited Successfully'
);

export const editReplyFail = createAction(
  '[Tag Annotation] Failed To Edit The Reply',
  props<{ error: string }>()
);

export const deleteAnnotation = createAction(
  '[Tag Annotation] Delete Annotation',
  props<{ annotation: Annotation }>()
);

export const deleteAnnotationSuccess = createAction(
  '[Tag Annotation] Annotation Deleted Successfully'
);

export const deleteAnnotationFail = createAction(
  '[Tag Annotation] Failed To Delete The Annotation',
  props<{ error: string }>()
);

export const editAnnotation = createAction(
  '[Tag Annotation] Edit Annotation',
  props<{ annotation: Annotation }>()
);

export const editAnnotationSuccess = createAction(
  '[Tag Annotation] Annotation Edited Successfully'
);

export const editAnnotationFail = createAction(
  '[Tag Annotation] Failed To Edit The Annotation',
  props<{ error: string }>()
);

export const initialiseNotificationSettings = createAction(
  '[Course] Initialise Notification Settings',
  props<{ notificationSettings: BlockingNotifications }>()
);

//The below action is for the notification feature. When the 3 dotted Menu for a topic is clicked, the topic which was clicked is saved. This is used in order to show the notification settings in the context menu for the particular topic clicked in the context menu
export const setLastTopicMenuClicked = createAction(
  '[Course] Set Last Topic Menu Clicked',
  props<{ lastTopicMenuClickedId: string }>()
);

export const setTopicNotificationSettings = createAction(
  '[Notification] Set Topic Notification Settings',
  props<{
    settings: {
      courseId: string;
      topicId: string;
      [key: string]: boolean | string;
    };
  }>()
);

export const setTopicNotificationSettingsSuccess = createAction(
  '[Notification] Set Topic Notification Settings Success',
  props<{
    updatedDoc: BlockingNotifications;
  }>()
);

export const setTopicNotificationSettingsFailure = createAction(
  '[Notification] Set Topic Notification Settings Failure',
  props<{
    error: any;
  }>()
);

export const unsetTopicNotificationSettings = createAction(
  '[Notification] Unset Topic Notification Settings',
  props<{
    settings: {
      courseId: string;
      topicId: string;
    };
  }>()
);

export const unsetTopicNotificationSettingsSuccess = createAction(
  '[Notification] Unset Topic Notification Settings Success',
  props<{
    updatedDoc: BlockingNotifications;
  }>()
);

export const unsetTopicNotificationSettingsFailure = createAction(
  '[Notification] Unset Topic Notification Settings Failure',
  props<{ error: any }>()
);

export const setLastChannelMenuClicked = createAction(
  '[Course] Set Last Channel Menu Clicked',
  props<{ lastChannelMenuClickedId: string }>()
);

export const setChannelNotificationSettings = createAction(
  '[Notification] Set Channel Notification Settings',
  props<{
    settings: {
      courseId: string;
      channelId: string;
      [key: string]: boolean | string;
    };
  }>()
);

export const setChannelNotificationSettingsSuccess = createAction(
  '[Notification] Set Channel Notification Settings Success',
  props<{
    updatedDoc: BlockingNotifications;
  }>()
);

export const setChannelNotificationSettingsFailure = createAction(
  '[Notification] Set Channel Notification Settings Failure',
  props<{
    error: any;
  }>()
);

export const unsetChannelNotificationSettings = createAction(
  '[Notification] Unset Channel Notification Settings',
  props<{
    settings: {
      courseId: string;
      channelId: string;
    };
  }>()
);

export const unsetChannelNotificationSettingsSuccess = createAction(
  '[Notification] Unset Channel Notification Settings Success',
  props<{
    updatedDoc: BlockingNotifications;
  }>()
);

export const unsetChannelNotificationSettingsFailure = createAction(
  '[Notification] Unset Channel Notification Settings Failure',
  props<{ error: any }>()
);

export const setLastMaterialMenuClicked = createAction(
  '[Course] Set Last Material Menu Clicked',
  props<{ lastMaterialMenuClickedId: string }>()
);

export const setMaterialNotificationSettings = createAction(
  '[Notification] Set Material Notification Settings',
  props<{
    settings: {
      courseId: string;
      materialId: string;
      [key: string]: boolean | string;
    };
  }>()
);

export const setMaterialNotificationSettingsSuccess = createAction(
  '[Notification] Set Material Notification Settings Success',
  props<{
    updatedDoc: BlockingNotifications;
  }>()
);

export const setMaterialNotificationSettingsFailure = createAction(
  '[Notification] Set Material Notification Settings Failure',
  props<{
    error: any;
  }>()
);

export const unsetMaterialNotificationSettings = createAction(
  '[Notification] Unset Material Notification Settings',
  props<{
    settings: {
      courseId: string;
      materialId: string;
    };
  }>()
);

export const unsetMaterialNotificationSettingsSuccess = createAction(
  '[Notification] Unset Material Notification Settings Success',
  props<{
    updatedDoc: BlockingNotifications;
  }>()
);

export const unsetMaterialNotificationSettingsFailure = createAction(
  '[Notification] Unset Material Notification Settings Failure',
  props<{ error: any }>()
);

export const followAnnotation = createAction(
  '[Notification] Follow Annotation Action',
  props<{ annotationId: string }>()
);

export const followAnnotationSuccess = createAction(
  '[Notification] Follow Annotation Success',
  props<{ updatedDoc: BlockingNotifications }>()
);

export const followAnnotationFailure = createAction(
  '[Notification] Follow Annotation Failure',
  props<{ error: any }>()
);

export const unfollowAnnotation = createAction(
  '[Notification] Unfollow Annotation Action',
  props<{ annotationId: string }>()
);

export const unfollowAnnotationSuccess = createAction(
  '[Notification] Unfollow Annotation Success',
  props<{ updatedDoc: BlockingNotifications }>()
);

export const unfollowAnnotationFailure = createAction(
  '[Notification] Unfollow Annotation Failure',
  props<{ error: any }>()
);
