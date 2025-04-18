const ObjectId = require("mongoose").Types.ObjectId;
const db = require("../models");
const User = db.user;

/**
 * @function allAccess
 * Test public access to all type of user roles
 *
 */
export const allAccess = (req, res) => {
  res.status(200).send("Public content");
};

/**
 * @function userBoard
 * Test access to role user
 *
 */
export const userBoard = (req, res) => {
  res.status(200).send("User content");
};

/**
 * @function moderatorBoard
 * Test access to role moderator
 *
 */
export const moderatorBoard = (req, res) => {
  res.status(200).send("Moderator content");
};

/**
 * @function adminBoard
 * Test access to role admin
 *
 */
export const adminBoard = (req, res) => {
  res.status(200).send("Admin content");
};
/**
 * @function accessPersonalDashboard
 * access personal Dashboard
 *
 * @param {string} req.userId The id of the user.
 */
export const accessPersonalDashboard = async (req, res, next) => {
  const userId = req.userId;

  let foundUser;
  try {
    foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(404).send({ error: `User not found` });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
  }

  req.locals = {
    user: foundUser,
  };

  next();
};

/**
 * @function newIndicator
 * add new indicator controller
 *
 * @param {string} req.body.src The sourse of the iframe
 * @param {string} req.body.width The width of the iframe
 * @param {string} req.body.height The height of the iframe
 * @param {string} req.userId The id of the user.
 */
export const newIndicator = async (req, res, next) => {
  const userId = req.userId;

  let user;
  try {
    user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ error: error });
  }

  const indicator = {
    _id: new ObjectId(),
    src: req.body.src,
    width: req.body.width,
    height: req.body.height,
    frameborder: req.body.frameborder,
  };

  user.indicators.push(indicator);

  try {
    user.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  req.locals = {
    user: user,
    indicator: indicator,
    success: `Indicator added successfully!`,
  };
  next();
  // return res.status(200).send({
  //   success: `Indicator added successfully!`,
  //   indicator: indicator,
  // });
};

/**
 * @function deleteIndicator
 * delete indicator controller
 *
 * @param {string} req.params.indicatorId The id of the indicator
 * @param {string} req.userId The id of the user. Only owner of the indicator can delete
 */
export const deleteIndicator = async (req, res, next) => {
  const indicatorId = req.params.indicatorId;
  const userId = req.userId;

  let user;
  try {
    user = await User.findOne({ "indicators._id": indicatorId });
    if (!user) {
      return res.status(404).send({
        error: `indicator with id ${indicatorId} doesn't exist!`,
      });
    }

    if (user._id.toString() !== userId) {
      return res.status(404).send({
        error: `indicator with id ${indicatorId} doesn't belong to user with id ${userId}!`,
      });
    }
  } catch (error) {
    return res.status(500).send({ error: error });
  }

  // Find the indicator to delete
  let deletedIndicator;
  deletedIndicator = user.indicators.find(
    (indicator) => indicator._id.toString() === indicatorId
  );
  if (!deletedIndicator) {
    return res.status(404).send({
      error: `Indicator with id ${indicatorId} not found in the personal Dashboard!`,
    });
  }
  user.indicators = user.indicators.filter(
    (indicator) => indicator._id.toString() !== indicatorId
  );

  try {
    user.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  req.locals = {
    user: user,
    indicator: deletedIndicator,
    success: `Indicator deleted successfully!`,
  };
  next();
  // return res.status(200).send({
  //   success: `Indicator deleted successfully!`,
  // });
};

/**
 * @function getIndicators
 * get indicators controller
 *
 * @param {string} req.userId The id of the user
 */
export const getIndicators = async (req, res, next) => {
  const userId = req.userId;

  let user;
  try {
    user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ error: error });
  }

  const response = user.indicators ? user.indicators : [];
  return res.status(200).send(response);
};

/**
 * @function resizeIndicator
 * resize indicator controller
 *
 * @param {string} req.params.indicatorId The id of the indicator
 * @param {string} req.params.width The width of the indicator
 * @param {string} req.params.height The height of the indicator
 * @param {string} req.userId The id of the user
 */
export const resizeIndicator = async (req, res, next) => {
  const indicatorId = req.params.indicatorId;
  const newWidth = req.params.width;
  const newHeight = req.params.height;
  const userId = req.userId;

  let user;
  try {
    user = await User.findOne({ "indicators._id": indicatorId });
    if (!user) {
      return res.status(404).send({
        error: `indicator with id ${indicatorId} doesn't exist!`,
      });
    }

    if (user._id.toString() !== userId) {
      return res.status(404).send({
        error: `indicator with id ${indicatorId} doesn't belong to user with id ${userId}!`,
      });
    }
  } catch (error) {
    return res.status(500).send({ error: error });
  }

  let resizedIndicator;
  let oldDimensions = {};
  user.indicators.forEach((indicator) => {
    if (indicator._id.toString() === indicatorId.toString()) {
      oldDimensions = {
        width: indicator.width,
        height: indicator.height,
      };
      indicator.width = newWidth;
      indicator.height = newHeight;
      resizedIndicator = indicator;
    }
  });

  try {
    user.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  req.locals = {
    indicator: resizedIndicator,
    user: user,
    oldDimensions: oldDimensions,
    newDimensions: { width: newWidth, height: newHeight },
    success: `Indicator resized successfully!`,
  };
  next();
  //return res.status(200).send();
};

/**
 * @function reorderIndicators
 * reorder indicators controller
 *
 * @param {string} req.params.newIndex The newIndex of the reordered indicator
 * @param {string} req.params.oldIndex The oldIndex of the reordered indicator
 * @param {string} req.userId The id of the user
 */
export const reorderIndicators = async (req, res, next) => {
  const newIndex = parseInt(req.params.newIndex);
  const oldIndex = parseInt(req.params.oldIndex);
  const userId = req.userId;

  let user;
  try {
    user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }
  } catch (error) {
    return res.status(500).send({ error: error });
  }

  let indicator = user.indicators[oldIndex];

  if (oldIndex < newIndex) {
    for (let i = oldIndex; i < newIndex; i++) {
      user.indicators[i] = user.indicators[i + 1];
    }
  } else {
    for (let i = oldIndex; i > newIndex; i--) {
      user.indicators[i] = user.indicators[i - 1];
    }
  }

  user.indicators[newIndex] = indicator;

  try {
    user.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  req.locals = {
    user: user,
    indicator: indicator,
    oldIndex: oldIndex,
    newIndex: newIndex,
    indicators: user.indicators,
    success: `Indicators updated successfully!`,
  };
  next();
  // return res.status(200).send({
  //   success: `Indicators updated successfully!`,
  //   indicators: user.indicators,
  // });
};

export const getAllUsers = async (req, res) => {
  let users;
  try {
    users = await User.find({}).populate("courses", "-__v");
  } catch (err) {
    return res.status(500).send({ message: err });
  }
  let results = [];
  users.forEach((c) => {
    let user = {
      _id: c.id,
      firstname: c.firstname,
      lastname: c.lastname,
    };
    results.push(user);
  });
  return res.status(200).send(results);
};

export const getUser = async (req, res) => {
  let userId = req.params.userId;

  let foundUser;
  let results = [];
  let my_object = {};
  try {
    foundUser = await User.findById(userId).populate("courses", "-__v");

    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
  }
  my_object.firstname = foundUser.firstname;
  my_object.lastname = foundUser.lastname;
  results.push(my_object);
  return res.status(200).send(my_object);
};

export const getUserConcepts = async (req, res) => {
  let userId = req.params.userId;

  
  let foundUser;
  let results;
  try {
    foundUser = await User.findOne({ _id: userId }).populate("courses", "-__v");
    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist!`,
      });
    }
    results={
      understoodConcepts: foundUser.understoodConcepts,
      didNotUnderstandConcepts: foundUser.didNotUnderstandConcepts,
    }
   
    return res.status(200).send(results);
  } catch (err) {
    console.error('Error in getUserConcepts:', err);
    return res.status(500).send({ error: err });
  }
  // finally {
  //   // Log completed requests for tracking
  //   console.log(`Request completed for userId: ${userId}`);
  // }
};


  export  const updateUserConcepts = async (req, res) => {
    const { userId, understoodConcepts, didNotUnderstandConcepts } = req.body;
  
    try {
      // Find the user based on the provided userId
      let foundUser = await User.findOne({ _id: userId }).populate("courses", "-__v");
      
      if (!foundUser) {
        return res.status(404).send({
          error: `User with id ${userId} doesn't exist!`,
        });
      }
  
      // Add new `didNotUnderstandConcepts` items to `conceptTimestamps` with the current date if they don't exist
      didNotUnderstandConcepts.forEach((conceptId) => {
        if (!foundUser.conceptTimestamps.has(conceptId)) {
          foundUser.conceptTimestamps.set(conceptId, new Date());
        }
      });
  
      // Remove any items from `conceptTimestamps` that are no longer in `didNotUnderstandConcepts`
      foundUser.conceptTimestamps.forEach((_, conceptId) => {
        if (!didNotUnderstandConcepts.includes(conceptId)) {
          foundUser.conceptTimestamps.delete(conceptId);
        }
      });
  
      // Prepare the update document
      const updatedDocument = {
        $set: {
          understoodConcepts: understoodConcepts,
          didNotUnderstandConcepts: didNotUnderstandConcepts,
          conceptTimestamps: foundUser.conceptTimestamps, // Include the updated map
        },
      };
  
      // Update the user's concepts and timestamps in the database
      const updateResult = await foundUser.updateOne(updatedDocument);
      
      // Check if any changes were made
      if (updateResult.modifiedCount === 0) {
        return res.status(200).send({
          message: "No changes made. Check if the concepts are the same as before.",
        });
      }
  
      // Send success response
      res.status(200).send({ message: "User concepts updated successfully." });
    } catch (error) {
      // Handle any errors during the process
      console.error('Error updating user concepts:', error);
      res.status(500).send({ error: error.message });
    }
  };
  

export const getLastTimeCourseMapperOpened = async (req, res) => {
  let userId = req.userId;

  let foundUser;
  try {
    foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
  }
  return res
    .status(200)
    .send({ lastTimeCourseMapperOpened: foundUser.lastTimeCourseMapperOpened });
};

export const updateLastTimeCourseMapperOpened = async (req, res) => {
  let userId = req.userId;

  let foundUser;
  try {
    foundUser = await User.findById(userId);
    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: "Error finding user" });
  }
  foundUser.lastTimeCourseMapperOpened = new Date();
  try {
    foundUser = await foundUser.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res
    .status(200)
    .send({ lastTimeCourseMapperOpened: foundUser.lastTimeCourseMapperOpened });
};
