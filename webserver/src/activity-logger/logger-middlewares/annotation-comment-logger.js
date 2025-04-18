import { generateAddMentionStatement } from "../generator/annotation-comment/annotation-generator";

const annotationActivityGenerator = require("../generator/annotation-comment/annotation-generator");
const commentActivityGenerator = require("../generator/comment/comment-generator");
const activityController = require("../controller/activity-controller");
const notifications = require("../../middlewares/Notifications/notifications");

export const annotateMaterialLogger = async (req, res, next) => {
  try {
    if (req.locals.annotation.tool.type === "annotation") {
      next(); // The user did'nt annotate the material
    } else {
      req.locals.activity = await activityController.createActivity(
        req.locals.annotation.tool
          ? annotationActivityGenerator.generateAnnotateMaterialActivity(req)
          : commentActivityGenerator.generateCommentActivity(req)
      );
      next();
    }
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
    next();
  }
};
export const createAnnotationLogger = async (req, res, next) => {
  try {
    // req.locals.activity = await activityController.createActivity(
    //   req.locals.annotation.tool
    //     ? annotationActivityGenerator.generateCreateAnnotationActivity(req)
    //     : commentActivityGenerator.generateCommentActivity(req),
    //   notifications.generateNotificationInfo(req)
    // );

    req.locals.activity = await activityController.createActivity(
      req.locals.annotation.tool
        ? annotationActivityGenerator.generateCreateAnnotationActivity(req)
        : commentActivityGenerator.generateCommentActivity(req),
      notifications.generateNotificationInfo(req)
    );

    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
    next();
  }
};

export const deleteAnnotationLogger = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      req.locals.annotation.tool
        ? annotationActivityGenerator.generateDeleteAnnotationActivity(req)
        : commentActivityGenerator.generateDeleteCommentActivity(req),
      notifications.generateNotificationInfo(req)
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const likeAnnotationLogger = async (req, res, next) => {
  const { like, annotation } = req.locals;
  const statement = like
    ? annotation.tool
      ? annotationActivityGenerator.generateLikeAnnotationActivity(req)
      : commentActivityGenerator.generateLikeCommentActivity(req)
    : annotation.tool
    ? annotationActivityGenerator.getAnnotationUnlikeStatement(req)
    : commentActivityGenerator.generateUnlikeCommentActivity(req);
  try {
    req.locals.activity = await activityController.createActivity(
      statement,
      notifications.generateNotificationInfo(req)
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const dislikeAnnotationLogger = async (req, res, next) => {
  const { dislike, annotation } = req.locals;
  const statement = dislike
    ? annotation.tool
      ? annotationActivityGenerator.generateDislikeAnnotationActivity(req)
      : commentActivityGenerator.generateDislikeCommentActivity(req)
    : annotation.tool
    ? annotationActivityGenerator.generateUndislikeAnnotationActivity(req)
    : commentActivityGenerator.generateUndislikeCommentActivity(req);
  try {
    req.locals.activity = await activityController.createActivity(
      statement,
      notifications.generateNotificationInfo(req)
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const editAnnotation = async (req, res, next) => {
  try {
    req.locals.activity = await activityController.createActivity(
      req.locals.oldAnnotation.tool
        ? annotationActivityGenerator.generateEditAnnotationActivity(req, true)
        : commentActivityGenerator.generateEditCommentActivity(req),
      notifications.generateNotificationInfo(req)
    );
    next();
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};

export const addMentionLogger = async (req, res, next) => {
  req.locals.category = "mentionedandreplied";
  let mentioned = req.locals.isMentionedUsersPresent;
  if (mentioned > 0) {
    const mentionedUsers = req.locals.mentionedUsers;
    try {
      for (const mentionedUser of mentionedUsers) {
        req.locals.mentionedUser = mentionedUser; // Add the individual user to req.locals
        await activityController.createActivity(
          annotationActivityGenerator.generateAddMentionStatement(req)
        );
      }
      notifications.generateNotificationInfo(req), next();
    } catch (err) {
      res.status(400).send({ error: "Error saving statement to mongo", err });
    }
    // try {
    //   req.locals.activity = await activityController.createActivity(
    //     annotationActivityGenerator.generateAddMentionStatement(req),
    //     notifications.generateNotificationInfo(req)
    //   );
  }
};
export const hideAnnotationsLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      annotationActivityGenerator.generateHideAnnotationsActivity(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const unhideAnnotationsLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      annotationActivityGenerator.generateUnhideAnnotationsActivity(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
export const filterAnnotationsLogger = async (req, res) => {
  try {
    await activityController.createActivity(
      annotationActivityGenerator.generateFilterAnnotationsActivity(req)
    );
    res.status(200).json({
      message: "Activity logged successfully",
    });
  } catch (err) {
    res.status(400).send({ error: "Error saving statement to mongo", err });
  }
};
