

const db = require("../models");
const User = db.user;
const Role = db.role;
const Course = db.course;
const Topic = db.topic;
const Channel = db.channel;
const Annotation = db.annotation;
const Material = db.material;
const Reply = db.reply;

import { hashSync } from "bcryptjs";


export const generteTestdata = async (req, res, next) => {

    console.log('generate Data');
    const userId = req.userId;
    const courseName = "Course_Test_" + req.params.courseNr;
    const topicName = "Topic Test " + req.params.courseNr;
    const channelName = "Channel Test " + req.params.courseNr;
    const materialNamepdf = "Material pdf Test" + req.params.courseNr;
    const materialNamevid = "Material vid Test" + req.params.courseNr;
    const annotationContent = "Annotation Test" + req.params.courseNr;
    const commentContent = "Comment Test" + req.params.courseNr;
    const replyContent = "Reply Test" + req.params.courseNr;
    const annotationType = "externalResource";
    const location = {
      "type": "time",
      "startPage": 2,
      "lastPage": 2
    }
    const tool = {
      "id": "a21",
      "type": "drawBox",
      "coordinates": [],
      "color": "RGB(238,170,0, .5)",
      "page": 2,
      "rect": {
          "id": "a21",
          "type": "rectangle",
          "isDelete": false,
          "pageNumber": 2,
          "lineHeight": 3,
          "coordinates": {
              "height": 18,
              "width": 362,
              "x1": 269.40625,
              "x2": 631.40625,
              "y1": 630.359375,
              "y2": 648.359375
          },
          "rectangleId": "rectangle-2"
      }
    }
  
    const userPrefix = req.params.userPrefix;
  
  
  
  
    let course = await newCourse(courseName, courseName, userId);
    if (course){
      console.log("course", course);
      let topic = await newTopic(course._id, topicName, userId);
      if (topic){
        console.log("topic", topic);
        let channel = await newChannel(topic._id, channelName, channelName, userId);
        if (channel){
          console.log("channel", channel);
          let pdf = await newMaterial(course._id, channel._id, "pdf", materialNamepdf, "https://www.youtube.com/watch?v=zJxJerQtUdk", materialNamepdf, userId);
          let vid = await newMaterial(course._id, channel._id, "video", materialNamevid, "https://www.youtube.com/watch?v=zJxJerQtUdk", materialNamevid, userId);
  
          if(pdf && vid) {
            console.log("vid", vid);
            console.log("pdf", pdf);
            let annotation = await newAnnotation(course._id, pdf._id, userId, annotationContent, annotationType, location, tool);
            if (annotation){
              console.log("annotationa", annotation);
              let reply = await newReply(course._id, annotation._id, replyContent, userId)
  
              if (reply){
                console.log("reply", reply);
                for(let i = 0 ; i<100 ; i++){
                  const username = userPrefix+i;
                  let user = await createUser("firstname", "lastname", username, username+"@"+courseName+".de" );
                  if (user){
                    console.log(`"${user.username}","hashedPassword"`);
                    await enrolCourse(course._id, user._id);
                  }
                }
                res.send({});
              } else {
                console.log('reply problem');
              }
            } else {
              console.log('annotation problem');
            }
          } else {
            console.log('material problem');
          }
        } else {
          console.log('channel problem');
        }
      }else {
        console.log('topic problem');
      }
    } else {
      console.log('course problem');
    }
  }
  
  
  
  
  export const newCourse = async (courseName, courseDesc, userId) => {
  
    let foundUser;
    try {
      foundUser = await User.findById(userId);
      if (!foundUser) {
        return false ;
      }
    } catch (err) {
      return false;
    }
  
    let foundCourse;
    try {
      foundCourse = await Course.findOne({ name: courseName });
      console.log(foundCourse);
      if (foundCourse) {
        console.log("course found");
        return false;
      }
    } catch (err) {
      console.log(err);
      return false;
    }
  
    let shortName = courseName
        .split(" ")
        .map((word, index) => {
          if (index < 3) {
            return word[0];
          }
        })
        .join("");
  
    let foundRole;
    try {
      foundRole = await Role.findOne({ name: "moderator" });
    } catch (err) {
      return false;
    }
  
    let userList = [];
    let newUser = {
      userId: foundUser._id,
      role: foundRole._id,
    };
    userList.push(newUser);
  
    let course = new Course({
      name: courseName,
      shortName: shortName,
      // userId: req.userId,
      description: courseDesc,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      users: userList,
    });
  
    let courseSaved;
    try {
      courseSaved = await course.save();
    } catch (err) {
      return false;
    }
  
    foundUser.courses.push({
      courseId: courseSaved._id,
      role: foundRole._id,
    });
  
    try {
      await foundUser.save();
    } catch (err) {
      return false;
    }
    return courseSaved; 
  };
  
  export const enrolCourse = async (courseId, userId) => {
  
  
    let foundCourse;
    try {
      foundCourse = await Course.findById(courseId);
      if (!foundCourse) {
        return false;
      }
    } catch (err) {
      console.log(err);
      return false;
    }
  
    let foundUser;
    try {
      foundUser = await User.findOne({ _id: userId });
      if (!foundUser) {
        return false;
      }
    } catch (err) {
      console.log(err);
      return false;
    }
  
    let alreadyEnrolled = foundUser.courses.find(
      (course) => course.courseId.valueOf() === courseId.valueOf()
    );
  
    if (!alreadyEnrolled) {
      let role;
      try {
        role = await Role.findOne({ name: "moderator" });
      } catch (err) {
        console.log(err);
        return false;
      }
  
      foundUser.courses.push({
        courseId: foundCourse._id,
        role: role._id,
      });
  
      try {
        await foundUser.save();
      } catch (err) {
        console.log(err);
        return false;
      }
  
      foundCourse.users.push({
        userId: foundUser._id,
        role: role._id,
      });
  
      try {
        await foundCourse.save();
      } catch (err) {
        console.log(err);
        return false;
      }
      return true;
    } else {
      return false;
    }
  };
  
  
  export const createUser = async (firstname, lastname, username, email) => {
    let role;
    try {
      role = await Role.findOne({ name: "user" });
    } catch (err) {
      return false;
    }
  
    let user = new User({
      firstname: firstname,
      lastname: lastname,
      username: username,
      email: email,
      role: role._id,
      password: hashSync("hashedPassword", 8),
    });
  
    try {
      await user.save();
  
      return user;
    } catch (err) {
      return false;
    }
  };
  
  
  export const newTopic = async (courseId, topicName, userId) => {
  
    let foundCourse;
    try {
      foundCourse = await Course.findOne({ _id: courseId });
      if (!foundCourse) {
        return false;
      }
    } catch (err) {
      console.log(err);
  
      return false;
    }
  
    let topic = new Topic({
      name: topicName,
      courseId: courseId,
      userId: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  
    let savedTopic;
    try {
      savedTopic = await topic.save();
    } catch (err) {
      console.log(err);
  
      return false;
    }
  
    foundCourse.topics.push(savedTopic._id);
  
    try {
      await foundCourse.save();
    } catch (err) {
      console.log(err);
  
      return false;
    }
  
    
    return savedTopic;
  };
  
  
  export const newChannel = async (topicId, channelName, channelDesc, userId) => {
  
    let foundTopic;
    try {
      foundTopic = await Topic.findOne({ _id: topicId });
      if (!foundTopic) {
        return false;
      }
    } catch (err) {
      console.log(err);
      return false;
    }
  
    let channel = new Channel({
      name: channelName,
      description: channelDesc,
      courseId: foundTopic.courseId,
      topicId: topicId,
      userId: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  
    let savedChannel;
    try {
      savedChannel = await channel.save();
    } catch (err) {
      console.log(err);
      return false;
    }
  
    foundTopic.channels.push(savedChannel._id);
  
    let savedTopic;
    try {
      savedTopic = await foundTopic.save();
    } catch (err) {
      console.log(err);
      return false;
    }
  
    let updateCourse;
    try {
      updateCourse = await Course.findOne({ _id: savedTopic.courseId });
    } catch (err) {
      console.log(err);
      return false;
    }
  
    updateCourse.channels.push(savedChannel._id);
    try {
      await updateCourse.save();
    } catch (err) {
      console.log(err);
      return false;
    }
  
    return savedChannel;
  };
  
  
  
  export const newMaterial = async (courseId, channelId, materialType, materialName, materialUrl, materialDesc, userId) => {
  
    let foundChannel;
    try {
      foundChannel = await Channel.findById({ _id: channelId});
      if (!foundChannel) {
        return false;
      }
      if (foundChannel.courseId.valueOf() !== courseId.valueOf()) {
        return false;
      }
    } catch (err) {
      console.log(err);
  
      return false;
    }
  
    let material = new Material({
      type: materialType,
      name: materialName,
      url: materialUrl,
      description: materialDesc,
      courseId: foundChannel.courseId,
      topicId: foundChannel.topicId,
      channelId: channelId,
      userId: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  
    let savedMaterial;
    try {
      savedMaterial = await material.save();
    } catch (err) {
      console.log(err);
      return false;
    }
  
    foundChannel.materials.push(savedMaterial._id);
    try {
      await foundChannel.save();
    } catch (err) {
      console.log(err);
      return false;
    }
  
    return savedMaterial;
  };
  
  
  export const newAnnotation = async (courseId, materialId, userId, annotationContent, annotationType, annotationLocation, annotationTool) => {
  
    let foundMaterial;
    try {
      foundMaterial = await Material.findById({ _id: materialId });
      if (!foundMaterial) {
        return false
      }
      if (foundMaterial.courseId.valueOf() !== courseId.valueOf()) {
        return false;
      }
    } catch (err) {
      console.log(err);
      return false;
    }
  
    let foundUser;
    try {
      foundUser = await User.findById({ _id: userId });
    } catch (err) {
      console.log(err);
      return false;
    }
  
    let authorName = `${foundUser.firstname} ${foundUser.lastname}`;
  
    let annotation = new Annotation({
      type: annotationType,
      content: annotationContent,
      author: {
        userId: userId,
        name: authorName,
      },
      location: annotationLocation,
      tool: annotationTool,
      courseId: foundMaterial.courseId,
      topicId: foundMaterial.topicId,
      channelId: foundMaterial.channelId,
      materialId: foundMaterial._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  
    let newAnnotation;
    try {
      newAnnotation = await annotation.save();
    } catch (err) {
      console.log(err);
      return false;
    }
  
    foundMaterial.annotations.push(newAnnotation._id);
  
    try {
      await foundMaterial.save();
    } catch (err) {
      console.log(err);
      return false;
    }
  
    // Checks for hashtags in content
    let foundTags = annotationContent.split(" ").filter((v) => v.startsWith("#"));
  
    if (foundTags.length !== 0) {
      let foundTagsSchema = [];
      foundTags.forEach((tag) => {
        let newTag = new Tag({
          name: tag,
          courseId: foundMaterial.courseId,
          topicId: foundMaterial.topicId,
          channelId: foundMaterial.channelId,
          materialId: foundMaterial._id,
          annotationId: newAnnotation._id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        foundTagsSchema.push(newTag);
      });
  
      try {
        await Tag.insertMany(foundTagsSchema);
      } catch (err) {
        console.log(err);
        return false;
      }
    }
  
    return newAnnotation;
  };
  
  
  export const newReply = async (courseId, annotationId, replyContent, userId) => {
  
  
    let user
    try {
      user = await User.findOne({_id: userId});
  
      if (!user) {
        return false;
      }
  
    } catch (error) {
      console.log(err);
      return false;
    }
  
    let foundAnnotation;
    try {
      foundAnnotation = await Annotation.findOne({ _id: annotationId });
      if (!foundAnnotation) {
        return false;
      }
      if (foundAnnotation.courseId.valueOf() !== courseId.valueOf()) {
        return false;
      }
    } catch (err) {
      console.log(err);
      return false;
    }
  
    let foundUser;
    try {
      foundUser = await User.findOne({ _id: userId });
    } catch (err) {
      console.log(err);
      return false;
    }
  
    let authorName = `${foundUser.firstname} ${foundUser.lastname}`;
  
    let reply = new Reply({
      content: replyContent,
      author: {
        userId: userId,
        name: authorName,
      },
      courseId: foundAnnotation.courseId,
      topicId: foundAnnotation.topicId,
      channelId: foundAnnotation.channelId,
      materialId: foundAnnotation.materialId,
      annotationId: foundAnnotation._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  
    let newReply;
    try {
      newReply = await reply.save();
    } catch (err) {
      console.log(err);
      return false;
    }
  
    foundAnnotation.replies.push(newReply._id);
  
    try {
      await foundAnnotation.save();
    } catch (err) {
      console.log(err);
      return false;
    }
  
    let foundTags = replyContent.split(" ").filter((v) => v.startsWith("#"));
  
    let foundTagsSchema = [];
    if (foundTags.length !== 0) {
      foundTags.forEach((tag) => {
        let newTag = new Tag({
          name: tag,
          courseId: foundAnnotation.courseId,
          topicId: foundAnnotation.topicId,
          channelId: foundAnnotation.channelId,
          materialId: foundAnnotation.materialId,
          annotationId: foundAnnotation._id,
          replyId: newReply._id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        foundTagsSchema.push(newTag);
      });
  
      try {
        await Tag.insertMany(foundTagsSchema);
      } catch (err) {
        console.log(err);
        return false;
      }
    }
  
    return newReply;
  };
  
  