import {
  createAction,
  createFeatureSelector,
  createReducer,
  createSelector,
  on,
} from '@ngrx/store';
import * as AppState from 'src/app/state/app.state';
import * as CourseAction from 'src/app/pages/courses/state/course.actions';
import { Course } from 'src/app/models/Course';
import { Channel } from 'src/app/models/Channel';
import { Tag } from 'src/app/models/Tag';
import { Topic } from 'src/app/models/Topic';
import { Annotation } from 'src/app/models/Annotations';
import {
  MaterialNotificationSettings,
  ChannelNotificationSettings,
  TopicNotificationSettings,
} from 'src/app/models/BlockingNotification';
import {
  topicNotificationSettingLabels,
  channelNotificationSettingLabels,
  materialNotificationSettingLabels,
  courseNotificationSettingLabels,
} from 'src/app/models/Notification';
export interface State extends AppState.State {
  courses: CourseState;
}
export interface CourseState {
  courseId: string;
  selectedCourse: Course;
  channelSelected: boolean;
  selectedChannel: Channel;
  tagsForCourse: Tag[];
  tagsForTopic: Tag[];
  tagsForChannel: Tag[];
  tagSelected: boolean;
  selectedTagName: string;
  selcetedTopic: Topic;
  annotationsForSelectedTag: Annotation[];
  lastTopicMenuClickedId: string;
  lastChannelMenuClickedId: string;
  lastMaterialMenuClickedId: string;
  topicsNotificationSettings: TopicNotificationSettings[];
  channelsNotificationSettings: ChannelNotificationSettings[];
  materialsNotificationSettings: MaterialNotificationSettings[];
  isAnnotationNotificationsEnabled: boolean;
  isCourseUpdateNotificationsEnabled: boolean;
  isReplyAndMentionedNotificationsEnabled: boolean;
  isCourseLevelOverride: boolean;
}
const initialState: CourseState = {
  courseId: null,
  selectedCourse: null,
  channelSelected: false,
  selectedChannel: null,
  tagsForCourse: null,
  tagsForTopic: null,
  tagsForChannel: null,
  tagSelected: false,
  selectedTagName: null,
  selcetedTopic: null,
  annotationsForSelectedTag: null,
  lastTopicMenuClickedId: null,
  lastChannelMenuClickedId: null,
  lastMaterialMenuClickedId: null,
  topicsNotificationSettings: null,
  channelsNotificationSettings: null,
  materialsNotificationSettings: null,
  isAnnotationNotificationsEnabled: null,
  isCourseUpdateNotificationsEnabled: null,
  isReplyAndMentionedNotificationsEnabled: null,
  isCourseLevelOverride: null,
};
const getCourseFeatureState = createFeatureSelector<CourseState>('course');

export const getCurrentCourse = createSelector(
  getCourseFeatureState,
  (state) => state.selectedCourse
);

export const getCurrentCourseId = createSelector(
  getCourseFeatureState,
  (state) => state.courseId
);

export const getChannelSelected = createSelector(
  getCourseFeatureState,
  (state) => state.channelSelected
);

export const getSelectedChannel = createSelector(
  getCourseFeatureState,
  (state) => state.selectedChannel
);

export const getSelectedTopic = createSelector(
  getCourseFeatureState,
  (state) => state.selcetedTopic
);

export const getTagsForCourse = createSelector(
  getCourseFeatureState,
  (state) => state.tagsForCourse
);

export const getTagsForTopic = createSelector(
  getCourseFeatureState,
  (state) => state.tagsForTopic
);

export const getTagsForChannel = createSelector(
  getCourseFeatureState,
  (state) => state.tagsForChannel
);

export const getIsTagSelected = createSelector(
  getCourseFeatureState,
  (state) => state.tagSelected
);

export const getAnnotationsForSelectedTag = createSelector(
  getCourseFeatureState,
  (state) => state.annotationsForSelectedTag
);

export const getSelectedTagName = createSelector(
  getCourseFeatureState,
  (state) => state.selectedTagName
);

//return an array of object. where the object has a label and value property
//the label is type of Notifications enabled. and the value is a boolean
export const getNotificationSettingsOfLastTopicMenuClicked = createSelector(
  getCourseFeatureState,
  (state) => {
    if (!state.topicsNotificationSettings || !state.lastTopicMenuClickedId) {
      return null;
    }
    const topic = state.topicsNotificationSettings.find(
      (topic) => topic.topicId === state.lastTopicMenuClickedId
    );

    const notificationSettings = [
      {
        label: topicNotificationSettingLabels.courseDefault,
        value: topic.isTopicLevelOverride,
      },
      {
        label: topicNotificationSettingLabels.topicUpdates,
        value: topic.isCourseUpdateNotificationsEnabled,
      },
      {
        label: topicNotificationSettingLabels.commentsAndMentioned,
        value: topic.isReplyAndMentionedNotificationsEnabled,
      },
      {
        label: topicNotificationSettingLabels.annotations,
        value: topic.isAnnotationNotificationsEnabled,
      },
    ];
    return notificationSettings;
  }
);
export const getNotificationSettingsOfLastChannelMenuClicked = createSelector(
  getCourseFeatureState,
  (state) => {
    if (
      !state.channelsNotificationSettings ||
      !state.lastChannelMenuClickedId
    ) {
      return null;
    }
    const channel = state.channelsNotificationSettings.find(
      (channel) => channel.channelId === state.lastChannelMenuClickedId
    );
    const notificationSettings = [
      {
        label: channelNotificationSettingLabels.topicDefault,
        value: channel.isChannelLevelOverride,
      },
      {
        label: channelNotificationSettingLabels.channelUpdates,
        value: channel.isCourseUpdateNotificationsEnabled,
      },
      {
        label: channelNotificationSettingLabels.commentsAndMentioned,
        value: channel.isReplyAndMentionedNotificationsEnabled,
      },
      {
        label: channelNotificationSettingLabels.annotations,
        value: channel.isAnnotationNotificationsEnabled,
      },
    ];
    return notificationSettings;
  }
);

export const getNotificationSettingsOfLastMaterialMenuClicked = createSelector(
  getCourseFeatureState,
  (state) => {
    if (
      !state.materialsNotificationSettings ||
      !state.lastMaterialMenuClickedId
    ) {
      return null;
    }
    const material = state.materialsNotificationSettings.find(
      (material) => material.materialId === state.lastMaterialMenuClickedId
    );
    const notificationSettings = [
      {
        label: materialNotificationSettingLabels.channelDefault,
        value: material.isMaterialLevelOverride,
      },
      {
        label: materialNotificationSettingLabels.materialUpdates,
        value: material.isCourseUpdateNotificationsEnabled,
      },
      {
        label: materialNotificationSettingLabels.commentsAndMentioned,
        value: material.isReplyAndMentionedNotificationsEnabled,
      },
      {
        label: materialNotificationSettingLabels.annotations,
        value: material.isAnnotationNotificationsEnabled,
      },
    ];
    return notificationSettings;
  }
);

export const getNotificationSettingsOfCurrentCourse = createSelector(
  getCourseFeatureState,
  (state) => {
    const notificationSettings = [
      {
        label: courseNotificationSettingLabels.globalDefault,
        //TODO: change the below line when global notifications settings are implemented
        value: state.isCourseLevelOverride,
      },
      {
        label: courseNotificationSettingLabels.courseUpdates,
        value: state.isCourseUpdateNotificationsEnabled,
      },
      {
        label: courseNotificationSettingLabels.commentsAndMentioned,
        value: state.isReplyAndMentionedNotificationsEnabled,
      },
      {
        label: courseNotificationSettingLabels.annotations,
        value: state.isAnnotationNotificationsEnabled,
      },
    ];
    return notificationSettings;
  }
);

export const getLastTopicMenuClickedId = createSelector(
  getCourseFeatureState,
  (state) => state.lastTopicMenuClickedId
);

const getSelectTopic = createSelector(
  getCourseFeatureState,
  (state) => state.selcetedTopic
);

const getChannelsNotificationSettings = createSelector(
  getCourseFeatureState,
  (state) => state.channelsNotificationSettings
);

export const getFollowingAnnotationsOfDisplayedChannels = createSelector(
  getSelectTopic,
  getChannelsNotificationSettings,
  (selectedTopic, channelNotificationSettings) => {
    //in the state, we have the channelsNotificationSettings array
    //in the channelNotificationSettignsArray, for all the channels that have topicId equal to the topicId of the selected topic, for them return an object where they key is the id of the channel and the value is an array that contains the following annotations of that channel
    if (!channelNotificationSettings || !selectedTopic) {
      return null;
    }
    const channels = channelNotificationSettings.filter(
      (channel) => channel.topicId === selectedTopic._id
    );
    const followingAnnotationsOfDisplayedChannels = {};
    channels.forEach((channel) => {
      followingAnnotationsOfDisplayedChannels[channel.channelId] =
        channel.followingAnnotations;
    });

    return followingAnnotationsOfDisplayedChannels;
  }
);

export const getFollowStatusOfAnnotationsOfSelectedChannel = createSelector(
  getSelectedChannel,
  getChannelsNotificationSettings,
  (selectChannel, channelNotificationSettings) => {
    if (!selectChannel || !channelNotificationSettings) {
      return null;
    }
    const channel = channelNotificationSettings.find(
      (channel) => channel.channelId === selectChannel._id
    );

    return channel.followingAnnotations;
  }
);

export const getOverriddenChannelsMaterialsTopics = createSelector(
  getCourseFeatureState,
  (state) => {
    //for all the channels, topics and materials, check if they are overridden or not
    //if the are overridden, push that object to an array. in the end return that array
    const overriddenChannelsMaterialsTopics = [];
    if (state.channelsNotificationSettings) {
      state.channelsNotificationSettings.forEach((channel) => {
        if (channel.isChannelLevelOverride) {
          overriddenChannelsMaterialsTopics.push({
            ...channel,
            type: 'channel',
          });
        }
      });
    }
    if (state.topicsNotificationSettings) {
      state.topicsNotificationSettings.forEach((topic) => {
        if (topic.isTopicLevelOverride) {
          overriddenChannelsMaterialsTopics.push({ ...topic, type: 'topic' });
        }
      });
    }
    if (state.materialsNotificationSettings) {
      state.materialsNotificationSettings.forEach((material) => {
        if (material.isMaterialLevelOverride) {
          overriddenChannelsMaterialsTopics.push({
            ...material,
            type: 'material',
          });
        }
      });
    }
    return overriddenChannelsMaterialsTopics;
  }
);

export const courseReducer = createReducer<CourseState>(
  initialState,
  on(CourseAction.setCurrentCourse, (state, action): CourseState => {
    return {
      ...state,
      selectedCourse: action.selcetedCourse,
      tagSelected: false,
      selectedTagName: null,
      tagsForChannel: null,
      tagsForTopic: null,
    };
  }),

  on(CourseAction.setCourseId, (state, action): CourseState => {
    return {
      ...state,
      courseId: action.courseId,
    };
  }),

  on(CourseAction.toggleChannelSelected, (state, action): CourseState => {
    return {
      ...state,
      channelSelected: action.channelSelected,
    };
  }),

  on(CourseAction.SetSelectedChannel, (state, action): CourseState => {
    return {
      ...state,
      selectedChannel: action.selectedChannel,
    };
  }),

  on(CourseAction.selectTag, (state, action): CourseState => {
    return {
      ...state,
      tagSelected: action.tagSelected,
    };
  }),

  on(
    CourseAction.loadAnnotationsForSelectedTag,
    (state, action): CourseState => {
      return {
        ...state,
        tagSelected: action.tagSelected,
        selectedTagName: action.selectedTagName,
        courseId: action.courseId,
      };
    }
  ),

  on(
    CourseAction.loadAnnotationsForSelectedTagSuccess,
    (state, action): CourseState => {
      return {
        ...state,
        annotationsForSelectedTag: action.annotations,
      };
    }
  ),

  on(CourseAction.LoadTagsSuccess, (state, action): CourseState => {
    switch (action.tagsFor) {
      case 'course': {
        return {
          ...state,
          tagsForCourse: action.tags,
        };
      }
      case 'topic': {
        return {
          ...state,
          tagsForTopic: action.tags,
        };
      }
      case 'channel': {
        return {
          ...state,
          tagsForChannel: action.tags,
        };
      }
      default: {
        return {
          ...state,
          tagsForCourse: action.tags,
        };
      }
    }
  }),

  on(CourseAction.setCurrentTopic, (state, action): CourseState => {
    return {
      ...state,
      selcetedTopic: action.selcetedTopic,
    };
  }),

  on(
    CourseAction.updateAnnotationsForSelectedTag,
    (state, action): CourseState => {
      switch (action.payload.eventType) {
        case 'annotationCreated': {
          return {
            ...state,
            annotationsForSelectedTag: [
              action.payload.annotation,
              ...state.annotationsForSelectedTag,
            ] as Annotation[],
          };
        }
        case 'annotationLiked': {
          let annotations = [...state.annotationsForSelectedTag];
          let index = state.annotationsForSelectedTag.findIndex(
            (annotation) => annotation._id == action.payload.annotation._id
          );
          let updatedLikes = [...annotations[index].likes];
          let updatedDislikes = [...annotations[index].dislikes];
          updatedLikes = action.payload.annotation.likes;
          updatedDislikes = action.payload.annotation.dislikes;
          let updatedAnnotation = {
            ...annotations[index],
            likes: updatedLikes,
            dislikes: updatedDislikes,
          } as Annotation;
          annotations[index] = updatedAnnotation;
          return {
            ...state,
            annotationsForSelectedTag: annotations,
          };
        }
        case 'annotationUnliked': {
          let annotations = [...state.annotationsForSelectedTag];
          let index = state.annotationsForSelectedTag.findIndex(
            (annotation) => annotation._id == action.payload.annotation._id
          );
          let updatedLikes = [...annotations[index].likes];
          let updatedDislikes = [...annotations[index].dislikes];
          updatedLikes = action.payload.annotation.likes;
          updatedDislikes = action.payload.annotation.dislikes;
          let updatedAnnotation = {
            ...annotations[index],
            likes: updatedLikes,
            dislikes: updatedDislikes,
          } as Annotation;
          annotations[index] = updatedAnnotation;
          return {
            ...state,
            annotationsForSelectedTag: annotations,
          };
        }
        case 'annotationUndisliked': {
          let annotations = [...state.annotationsForSelectedTag];
          let index = state.annotationsForSelectedTag.findIndex(
            (annotation) => annotation._id == action.payload.annotation._id
          );
          let updatedLikes = [...annotations[index].likes];
          let updatedDislikes = [...annotations[index].dislikes];
          updatedLikes = action.payload.annotation.likes;
          updatedDislikes = action.payload.annotation.dislikes;
          let updatedAnnotation = {
            ...annotations[index],
            likes: updatedLikes,
            dislikes: updatedDislikes,
          } as Annotation;
          annotations[index] = updatedAnnotation;
          return {
            ...state,
            annotationsForSelectedTag: annotations,
          };
        }
        case 'annotationDisliked': {
          let annotations = [...state.annotationsForSelectedTag];
          let index = state.annotationsForSelectedTag.findIndex(
            (annotation) => annotation._id == action.payload.annotation._id
          );
          let updatedLikes = [...annotations[index].likes];
          let updatedDislikes = [...annotations[index].dislikes];
          updatedLikes = action.payload.annotation.likes;
          updatedDislikes = action.payload.annotation.dislikes;
          let updatedAnnotation = {
            ...annotations[index],
            likes: updatedLikes,
            dislikes: updatedDislikes,
          } as Annotation;
          annotations[index] = updatedAnnotation;
          return {
            ...state,
            annotationsForSelectedTag: annotations,
          };
        }
        case 'replyCreated': {
          let annotations = [...state.annotationsForSelectedTag];
          let index = state.annotationsForSelectedTag.findIndex(
            (annotation) => annotation._id === action.payload.annotation._id
          );
          let annotation = annotations.find(
            (annotation) => annotation._id === action.payload.annotation._id
          );
          let replies = [...annotation.replies];
          //Check if reply already exists:
          let exists = replies.some(
            (reply) => reply._id === action.payload.reply._id
          );
          if (!exists) {
            let updatedReplies = [...replies, action.payload.reply];
            let updatedAnnotation = {
              ...annotation,
              replies: updatedReplies,
            } as Annotation;
            annotations[index] = updatedAnnotation;
          }
          return {
            ...state,
            annotationsForSelectedTag: annotations,
          };
        }
        case 'replyDeleted': {
          let annotations = [...state.annotationsForSelectedTag];
          let index = state.annotationsForSelectedTag.findIndex(
            (annotation) => annotation._id === action.payload.annotation._id
          );
          let annotation = annotations.find(
            (annotation) => annotation._id === action.payload.annotation._id
          );
          let replies = [...annotation.replies];
          //Check if reply already exists:
          let exists = replies.some(
            (reply) => reply._id === action.payload.reply._id
          );
          if (exists) {
            replies.forEach((reply, index) => {
              if (reply._id === action.payload.reply._id)
                replies.splice(index, 1);
            });
            let updatedReplies = [...replies];
            let updatedAnnotation = {
              ...annotation,
              replies: updatedReplies,
            } as Annotation;
            annotations[index] = updatedAnnotation;
          }
          return {
            ...state,
            annotationsForSelectedTag: annotations,
          };
        }
        case 'replyEdited': {
          let annotations = [...state.annotationsForSelectedTag];
          let index = state.annotationsForSelectedTag.findIndex(
            (annotation) => annotation._id === action.payload.annotation._id
          );
          let annotation = annotations.find(
            (annotation) => annotation._id === action.payload.annotation._id
          );
          let replies = [...annotation.replies];
          //Check if reply already exists:
          let replyIndex = replies.findIndex(
            (reply) => reply._id === action.payload.reply._id
          );
          replies[replyIndex] = action.payload.reply;
          if (replies[replyIndex]) {
            let updatedReplies = [...replies];
            let updatedAnnotation = {
              ...annotation,
              replies: updatedReplies,
            } as Annotation;
            annotations[index] = updatedAnnotation;
          }
          return {
            ...state,
            annotationsForSelectedTag: annotations,
          };
        }
        case 'annotationDeleted': {
          let annotations = [...state.annotationsForSelectedTag];
          annotations.forEach((anno, index) => {
            if (anno._id === action.payload.annotation._id)
              annotations.splice(index, 1);
          });
          return {
            ...state,
            annotationsForSelectedTag: annotations,
          };
        }
        case 'annotationEdited': {
          let annotations = [...state.annotationsForSelectedTag];
          let index = annotations.findIndex(
            (anno) => anno._id == action.payload.annotation._id
          );
          annotations[index] = {
            ...annotations[index],
            content: action.payload.annotation.content,
          };
          return {
            ...state,
            annotationsForSelectedTag: annotations,
          };
        }
        default: {
          return {
            ...state,
          };
        }
      }
    }
  ),
  on(
    CourseAction.updateAnnotationsWithReplies,
    (state, action): CourseState => {
      return {
        ...state,
        annotationsForSelectedTag: action.annotations,
      };
    }
  ),
  /*   on(
    CourseAction.initialiseNotificationSettings,
    (state, action): CourseState => {
      return {
        ...state,
        topicsNotificationSettings: action.notificationSettings.topics,
      };
    }
  ), */
  on(CourseAction.setLastTopicMenuClicked, (state, action): CourseState => {
    return {
      ...state,
      lastTopicMenuClickedId: action.lastTopicMenuClickedId,
    };
  }),
  on(CourseAction.setLastChannelMenuClicked, (state, action): CourseState => {
    return {
      ...state,
      lastChannelMenuClickedId: action.lastChannelMenuClickedId,
    };
  }),
  on(CourseAction.setLastMaterialMenuClicked, (state, action): CourseState => {
    return {
      ...state,
      lastMaterialMenuClickedId: action.lastMaterialMenuClickedId,
    };
  }),

  on(
    CourseAction.initialiseNotificationSettings,
    (state, action): CourseState => {
      return {
        ...state,
        topicsNotificationSettings: action.notificationSettings.topics,
        channelsNotificationSettings: action.notificationSettings.channels,
        materialsNotificationSettings: action.notificationSettings.materials,
        isAnnotationNotificationsEnabled:
          action.notificationSettings.isAnnotationNotificationsEnabled,
        isCourseUpdateNotificationsEnabled:
          action.notificationSettings.isCourseUpdateNotificationsEnabled,
        isReplyAndMentionedNotificationsEnabled:
          action.notificationSettings.isReplyAndMentionedNotificationsEnabled,
        isCourseLevelOverride:
          action.notificationSettings.isCourseLevelOverride,
      };
    }
  ),

  on(
    CourseAction.setTopicNotificationSettingsSuccess,
    (state, action): CourseState => {
      //update the topics and the channels in the state, and add/update the material array
      let updatedDoc = action.updatedDoc;
      /*  let infoSentToBackend = action.infoSentToBackend; */
      return {
        ...state,
        topicsNotificationSettings: updatedDoc.topics,
        channelsNotificationSettings: updatedDoc.channels,
        materialsNotificationSettings: updatedDoc.materials,
      };
    }
  ),
  on(
    CourseAction.setChannelNotificationSettingsSuccess,
    (state, action): CourseState => {
      //update the topics and the channels in the state, and add/update the material array
      let updatedDoc = action.updatedDoc;
      /*  let infoSentToBackend = action.infoSentToBackend; */
      return {
        ...state,
        topicsNotificationSettings: updatedDoc.topics,
        channelsNotificationSettings: updatedDoc.channels,
        materialsNotificationSettings: updatedDoc.materials,
      };
    }
  ),

  on(
    CourseAction.setMaterialNotificationSettingsSuccess,
    (state, action): CourseState => {
      //update the topics and the channels in the state, and add/update the material array
      let updatedDoc = action.updatedDoc;
      /*  let infoSentToBackend = action.infoSentToBackend; */
      return {
        ...state,
        topicsNotificationSettings: updatedDoc.topics,
        channelsNotificationSettings: updatedDoc.channels,
        materialsNotificationSettings: updatedDoc.materials,
      };
    }
  ),

  on(
    CourseAction.unsetTopicNotificationSettingsSuccess,
    (state, action): CourseState => {
      //update the topics and the channels in the state, and add/update the material array
      let updatedDoc = action.updatedDoc;
      /*  let infoSentToBackend = action.infoSentToBackend; */
      return {
        ...state,
        topicsNotificationSettings: updatedDoc.topics,
        channelsNotificationSettings: updatedDoc.channels,
        materialsNotificationSettings: updatedDoc.materials,
      };
    }
  ),
  on(
    CourseAction.unsetChannelNotificationSettingsSuccess,
    (state, action): CourseState => {
      //update the topics and the channels in the state, and add/update the material array
      let updatedDoc = action.updatedDoc;
      return {
        ...state,
        topicsNotificationSettings: updatedDoc.topics,
        channelsNotificationSettings: updatedDoc.channels,
        materialsNotificationSettings: updatedDoc.materials,
      };
    }
  ),

  on(
    CourseAction.unsetMaterialNotificationSettingsSuccess,
    (state, action): CourseState => {
      //update the topics and the channels in the state, and add/update the material array
      let updatedDoc = action.updatedDoc;
      return {
        ...state,
        topicsNotificationSettings: updatedDoc.topics,
        channelsNotificationSettings: updatedDoc.channels,
        materialsNotificationSettings: updatedDoc.materials,
      };
    }
  ),

  on(CourseAction.followAnnotationSuccess, (state, action): CourseState => {
    //update the topics and the channels in the state, and add/update the material array
    let updatedDoc = action.updatedDoc;
    return {
      ...state,
      topicsNotificationSettings: updatedDoc.topics,
      channelsNotificationSettings: updatedDoc.channels,
      materialsNotificationSettings: updatedDoc.materials,
    };
  }),
  on(CourseAction.unfollowAnnotationSuccess, (state, action): CourseState => {
    //update the topics and the channels in the state, and add/update the material array
    let updatedDoc = action.updatedDoc;
    return {
      ...state,
      topicsNotificationSettings: updatedDoc.topics,
      channelsNotificationSettings: updatedDoc.channels,
      materialsNotificationSettings: updatedDoc.materials,
    };
  }),

  on(
    CourseAction.setCourseNotificationSettingsSuccess,
    (state, action): CourseState => {
      //update the topics and the channels in the state, and add/update the material array
      let updatedDoc = action.updatedDoc;
      return {
        ...state,
        topicsNotificationSettings: updatedDoc.topics,
        channelsNotificationSettings: updatedDoc.channels,
        materialsNotificationSettings: updatedDoc.materials,
        isAnnotationNotificationsEnabled:
          action.updatedDoc.isAnnotationNotificationsEnabled,
        isCourseUpdateNotificationsEnabled:
          action.updatedDoc.isCourseUpdateNotificationsEnabled,
        isReplyAndMentionedNotificationsEnabled:
          action.updatedDoc.isReplyAndMentionedNotificationsEnabled,
        isCourseLevelOverride: action.updatedDoc.isCourseLevelOverride,
      };
    }
  ),

  on(
    CourseAction.unsetCourseNotificationSettingsSuccess,
    (state, action): CourseState => {
      //update the topics and the channels in the state, and add/update the material array
      let updatedDoc = action.updatedDoc;
      return {
        ...state,
        topicsNotificationSettings: updatedDoc.topics,
        channelsNotificationSettings: updatedDoc.channels,
        materialsNotificationSettings: updatedDoc.materials,
        isAnnotationNotificationsEnabled:
          action.updatedDoc.isAnnotationNotificationsEnabled,
        isCourseUpdateNotificationsEnabled:
          action.updatedDoc.isCourseUpdateNotificationsEnabled,
        isReplyAndMentionedNotificationsEnabled:
          action.updatedDoc.isReplyAndMentionedNotificationsEnabled,
        isCourseLevelOverride: action.updatedDoc.isCourseLevelOverride,
      };
    }
  ),
  on(
    CourseAction.updateFollowingAnnotationsOnSocketEmit,
    (state, action): CourseState => {
      console.log('somethign happening');
      switch (action.payload.eventType) {
        case 'annotationDeleted': {
          let channelNotificationSetting =
            state.channelsNotificationSettings.find(
              (channelNotificationSetting) =>
                channelNotificationSetting.channelId ===
                action.payload.annotation.channelId
            );

          //from the channelNotificationSetting remove the followingAnnotation that has ID equal to the ID of the annotation that was deleted
          let followingAnnotations = [
            ...channelNotificationSetting.followingAnnotations,
          ];
          followingAnnotations.forEach((followingAnnotation, index) => {
            if (
              followingAnnotation.annotationId === action.payload.annotation._id
            ) {
              followingAnnotations.splice(index, 1);
            }
          });

          //update the channelNotificationSetting with the new followingAnnotations array
          let updatedChannelNotificationSetting = {
            ...channelNotificationSetting,
            followingAnnotations: followingAnnotations,
          };

          //update the channelsNotificationSettings array with the updatedChannelNotificationSetting
          let updatedChannelsNotificationSettings = [
            ...state.channelsNotificationSettings,
          ];
          let index = updatedChannelsNotificationSettings.findIndex(
            (channelNotificationSetting) =>
              channelNotificationSetting.channelId ===
              action.payload.annotation.channelId
          );

          updatedChannelsNotificationSettings[index] =
            updatedChannelNotificationSetting;

          return {
            ...state,
            channelsNotificationSettings: updatedChannelsNotificationSettings,
          };
        }
        case 'annotationEdited': {
          let newContent = action.payload.annotation.content;
          let channelNotificationSetting =
            state.channelsNotificationSettings.find(
              (channelNotificationSetting) =>
                channelNotificationSetting.channelId ===
                action.payload.annotation.channelId
            );

          //in the channelNotificationSetting find the followingAnnotation that has annotaiton id === action.payload.annotation._id
          let followingAnnotations = [
            ...channelNotificationSetting.followingAnnotations,
          ];
          let indexFollowingAnnotation = followingAnnotations.findIndex(
            (followingAnnotation) =>
              followingAnnotation.annotationId === action.payload.annotation._id
          );
          //update the content of the followingAnnotation with the new content
          let followingAnnotationToEdit = {
            ...followingAnnotations[indexFollowingAnnotation],
          };
          followingAnnotationToEdit.content = newContent;

          followingAnnotations[indexFollowingAnnotation] =
            followingAnnotationToEdit;

          //update the channelNotificationSetting with the new followingAnnotations array
          let updatedChannelNotificationSetting = {
            ...channelNotificationSetting,
            followingAnnotations: followingAnnotations,
          };

          //update the channelsNotificationSettings array with the updatedChannelNotificationSetting
          let updatedChannelsNotificationSettings = [
            ...state.channelsNotificationSettings,
          ];

          let index = updatedChannelsNotificationSettings.findIndex(
            (channelNotificationSetting) =>
              channelNotificationSetting.channelId ===
              action.payload.annotation.channelId
          );

          updatedChannelsNotificationSettings[index] =
            updatedChannelNotificationSetting;

          return {
            ...state,
            channelsNotificationSettings: updatedChannelsNotificationSettings,
          };
        }
        default: {
          return state;
        }
      }
    }
  )
);
