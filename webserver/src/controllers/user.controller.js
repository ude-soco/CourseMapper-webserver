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

  let user
  try {
    user = await User.findOne({_id: userId});

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

  } catch (error) {
    return res.status(500).send({ error: error });
  }

  const indicator = {
    _id: ObjectId(),
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

  return res.status(200).send({
    success: `indicator with id = '${indicator._id}' has been added successfully!`,
    indicator: indicator,
  });
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

  let user
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



  user.indicators = user.indicators.filter(
    (indicator) => indicator._id.toString() !== indicatorId
  );

  try {
    user.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  return res.status(200).send({
    success: `indicator with id = '${indicatorId}' has been deleted successfully!`,
  });
};


/**
 * @function getIndicators
 * get indicators controller
 *
 * @param {string} req.userId The id of the user
 */
export const getIndicators = async (req, res, next) => {
  const userId = req.userId;

  let user
  try {
    user = await User.findOne({_id: userId});

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

  } catch (error) {
    return res.status(500).send({ error: error });
  }


  const response = user.indicators? user.indicators : [];

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
  const width = req.params.width;
  const height = req.params.height;
  const userId = req.userId;

  let user
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


  user.indicators.forEach(indicator => {
    if (indicator._id.toString() === indicatorId.toString()){
      indicator.width = width;
      indicator.height = height;
    }
  });

  try {
    user.save();
  } catch (err) {
    return res.status(500).send({ error: err });
  }

  return res.status(200).send({
    success: `indicator with id = '${indicatorId}' has been updated successfully!`,
  });
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

  let user
  try {
    user = await User.findOne({_id: userId});

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

  return res.status(200).send({
    success: `indicators have been updated successfully!`,
    indicators: user.indicators
  });
};

export const getAllUsers = async (req, res) => {
  let users;
  console.log('get all users')
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
      lastname:c.lastname
      
    };
    results.push(user);
  });
  return res.status(200).send(results);
};

// export const getUserName = async (req, res) => {
//   let user;
//   let userId =  req.userId;
//   let results = []
//   try {

//     Founduser = await User
//     .findById({_id: ObjectId(userId)})
//   } catch (err) {
//     return res.status(500).send({ message: err });
//   }
//   user.courses.forEach(object => {
//     let course = {
//       _id: object.courseId._id,
//       name: object.courseId.name,
//       shortName: object.courseId.shortName,
//       description: object.courseId.description,
//       numberTopics: object.courseId.topics.length,
//       numberChannels: object.courseId.channels.length,
//       numberUsers: object.courseId.users.length,
//       role: object.role.name,
//       channels:object.courseId.channels,
//     };
//     results.push(course);
//   });
//   return res.status(200).send(results);
// }

export const getUser = async (req, res) => {
 
  let userId =  req.params.userId;

  let foundUser;
  let results = [];
  try {
    foundUser = await User.findOne({ _id: ObjectId(userId) })
    .populate("courses", "-__v");
    if (!foundUser) {
      return res.status(404).send({
        error: `User with id ${userId} doesn't exist!`,
      });
    }
  } catch (err) {
    return res.status(500).send({ error: err });
  }
  return res.status(200).send(foundUser);
};