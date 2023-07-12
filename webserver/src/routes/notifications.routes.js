const { authJwt } = require("../middlewares");
const controller = require("../controllers/notification.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Get all the notifications for user
  app.get(
    "/api/notifications",
    [authJwt.verifyToken],
    controller.getAllNotifications
  );

  //end point for marking the notifications as read. It should not generate a notification itself
  app.put(
    "/api/notifications/read",
    [authJwt.verifyToken],
    controller.markNotificationsAsRead
  );
  //end point for marking the notifications as unread. It should not generate a notification itself
  app.put(
    "/api/notifications/unread",
    [authJwt.verifyToken],
    controller.markNotificationsAsUnread
  );

  app.put(
    "/api/notifications/star",
    [authJwt.verifyToken],
    controller.starNotification
  );

  app.put(
    "/api/notifications/unstar",
    [authJwt.verifyToken],
    controller.unstarNotification
  );

  app.put(
    "/api/notifications/remove",
    [authJwt.verifyToken],
    controller.removeNotification
  );

  app.delete("/api/notifications", controller.deleteAllNotifications);

  app.get("/api/notifications/searchUsers", controller.searchUsers);

  app.post(
    "/api/notifications/followAnnotation/:annotationId",
    [authJwt.verifyToken],
    controller.followAnnotation
  );

  app.post(
    "/api/notifications/unfollowAnnotation/:annotationId",
    [authJwt.verifyToken],
    controller.unfollowAnnotation
  );

  app.put(
    "/api/notifications/setMaterialNotificationSettings",
    [authJwt.verifyToken],
    controller.setMaterialNotificationSettings
  );
  app.put(
    "/api/notifications/unsetMaterialNotificationSettings",
    [authJwt.verifyToken],
    controller.unsetMaterialNotificationSettings
  );
  app.put(
    "/api/notifications/setChannelNotificationSettings",
    [authJwt.verifyToken],
    controller.setChannelNotificationSettings
  );
  app.put(
    "/api/notifications/unsetChannelNotificationSettings",
    [authJwt.verifyToken],
    controller.unsetChannelNotificationSettings
  );

  app.put(
    "/api/notifications/setTopicNotificationSettings",
    [authJwt.verifyToken],
    controller.setTopicNotificationSettings
  );

  app.put(
    "/api/notifications/unsetTopicNotificationSettings",
    [authJwt.verifyToken],
    controller.unsetTopicNotificationSettings
  );

  app.put(
    "/api/notifications/setCourseNotificationSettings",
    [authJwt.verifyToken],
    controller.setCourseNotificationSettings
  );

  app.put(
    "/api/notifications/blockUser",
    [authJwt.verifyToken],
    controller.blockUser
  );

  app.put(
    "/api/notifications/unblockUser",
    [authJwt.verifyToken],
    controller.unblockUser
  );

  /*   //subscribe to a channel
  app.post(
    "/api/notifications/subscribe/channel",
    [authJwt.verifyToken],
    controller.subscribeChannel
  );

  //unsubscribe from a channel
  app.post(
    "/api/notifications/unsubscribe/channel",
    [authJwt.verifyToken],
    controller.unsubscribeChannel
  );

  //subscribe to a topic
  app.post(
    "/api/notifications/subscribe/topic",
    [authJwt.verifyToken],
    controller.subscribeTopic
  );

  //unsubscribe from a topic
  app.post(
    "/api/notifications/unsubscribe/topic",
    [authJwt.verifyToken],
    controller.unsubscribeTopic
  );

  app.post(
    "/api/notifications/subscribe/course",
    [authJwt.verifyToken],
    controller.subscribeCourse
  );

  app.post(
    "/api/notifications/unsubscribe/course",
    [authJwt.verifyToken],
    controller.unsubscribeCourse
  ); */
};
