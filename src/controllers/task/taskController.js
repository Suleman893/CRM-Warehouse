//Model
const Task = require("../../models/task/task.model.js");
const TaskComment = require("../../models/task/taskComment.model.js");
const TaskActivity = require("../../models/task/taskActivity.model.js");
//Responses and errors
const {
  error500,
  error404,
  error400,
} = require("../../services/helpers/errors");
const { status200, success } = require("../../services/helpers/response");
//helpers
const {
  toPlainObject,
  JSONParser,
} = require("../../services/helpers/commonHelpers.js");
const {
  uploadFileToBucket,
  deleteObjFromBucket,
} = require("../../services/helpers/awsHelper.js");
const axios = require("axios");
const config = require("../../config/index.js");

//Add task
const addTask = async (req, res, next) => {
  const body = toPlainObject(req.body);
  const {
    client,
    store,
    taskType,
    assignTo: assignToStringify,
    comment,
  } = body;
  try {
    //Parse the Stringify Array's
    const assignInfo = JSONParser(assignToStringify);
    const task = await Task.create({
      ...req.body,
      clientId: client,
      storeId: store,
      serviceId: taskType,
      assignToIds: assignInfo,
      createdById: req.userId,
    });
    if (comment) {
      let picture = {};
      if (req.files && req.files.file && req.files.file.length) {
        let file = req.files.file[0];
        const uploadParams = {
          Bucket: config.bucketName,
          Key: `task/${Date.now()}_${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        const uploadResult = await uploadFileToBucket(uploadParams);
        // Set picture details
        picture = {
          name: file.originalname,
          format: file.mimetype,
          location: uploadResult.location,
          key: uploadResult.key,
        };
      }
      const commentId = await TaskComment.create({
        taskId: task._id,
        title: comment,
        picture: picture,
        commentById: req.userId,
      });
      await Task.findByIdAndUpdate(task._id, {
        commentIds: commentId._id,
      });
    }
    return status200(res, "Task created successfully");
  } catch (err) {
    return next(err);
  }
};

//Add assignee in task
const addAssignee = async (req, res, next) => {
  const { id } = req.params;
  const { assignTo } = req.body;
  try {
    const task = await Task.findById(id);

    if (!task) {
      return error404(res, "Task not found");
    }

    assignTo.forEach((id) => {
      if (!task.assignToIds.includes(id)) {
        task.assignToIds.push(id);
      }
    });

    await task.save();
    return status200(res, "Assignee's added successfully");
  } catch (err) {
    return next(err);
  }
};

//Edit task
const editTask = async (req, res, next) => {
  const { id } = req.params;
  const body = toPlainObject(req.body);
  const { client, store, assignTo: assignToStringify } = body;
  //Parse the Stringify Array's
  const assignInfo = JSONParser(assignToStringify);
  try {
    const updatedTask = await Task.findByIdAndUpdate(id, {
      ...req.body,
      clientId: client,
      storeId: store,
      assignToIds: assignInfo,
    });
    if (!updatedTask) {
      return error404(res, "Task not found");
    }
    return status200(res, "Task edited successfully");
  } catch (err) {
    return next(err);
  }
};

//All task's
const allTasks = async (req, res, next) => {
  const { status, text, searchMode, date, page = 1, pageSize = 10 } = req.query;

  //Query object
  let query = {};

  if (status) {
    query.status = status;
  }

  if (text) {
    query.name = { $regex: text, $options: "i" };
  }

  try {
    //Role based filtering
    if (req.role !== "ADMIN") {
      query.$or = [{ createdById: req.userId }, { assignToIds: req.userId }];
    }

    //Helpers for fetching from the Auth Service
    async function fetchAllUsers() {
      try {
        const response = await axios.get(
          `${config.authServiceBaseUrl}/users/get_many?network_id=${config.networkId}`,
          {
            headers: {
              Authorization: `Bearer ${req.token}`,
            },
          }
        );
        if (
          response &&
          response?.data &&
          Array.isArray(response?.data) &&
          response?.data?.length > 0
        ) {
          if (
            Array.isArray(response?.data[0]) &&
            response?.data[0]?.length > 0
          ) {
            return response?.data[0];
          } else return [];
        } else return [];
      } catch (err) {
        if (err.response.status === 401) {
          throw new Error("Invalid token for Auth Service");
        }
        throw new Error("Error in Auth Service");
      }
    }
    async function attachUserDetails(task, allUsers) {
      const findUser = (userId) => {
        const user = allUsers.find((user) => user.user_id === userId);
        if (user) {
          return {
            first_name: user?.first_name,
            last_name: user?.last_name,
            email: user?.email,
            user_id: user?.user_id,
          };
        }
        return null;
      };
      const assignToUsers = task.assignToIds
        .map((userId) => findUser(userId))
        .filter(Boolean);
      return {
        ...task,
        assignToIds: assignToUsers,
      };
    }

    const tasks = await Task.find(query)
      .select("-__v")
      .populate([
        {
          path: "clientId",
          select: "-__v",
          populate: {
            path: "routeId",
            select: "-__v",
          },
        },
        {
          path: "storeId",
          select: "-__v",
        },
        {
          path: "serviceId",
          select: "-__v",
        },
        // {
        //   path: "assignToIds",
        // },
        // {
        //   path: "createdById",
        // },
      ])
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
      .lean();

    const total = await Task.countDocuments(query);
    const totalPages = Math.ceil(total / pageSize);

    //Modify response with Auth Service Response
    const allUsers = await fetchAllUsers();

    if (!allUsers.length) {
      return error404(res, "No users returned from Auth Service");
    }

    const modifiedTasks = await Promise.all(
      tasks.map((task) => attachUserDetails(task, allUsers))
    );

    const response = {
      tasks: modifiedTasks,
      total,
      totalPages,
    };
    return success(res, "200", "Success", response);
  } catch (err) {
    if (err.message === "Error in Auth Service") {
      return error500(res, err.message);
    }
    if (err.message === "Invalid token for Auth Service") {
      return error500(res, err.message);
    }
    return next(err);
  }
};

//Change priority
const changePriority = async (req, res, next) => {
  const { id } = req.params;
  const { priority } = req.body;
  try {
    const updatedTask = await Task.findByIdAndUpdate(id, {
      priority,
    });
    if (!updatedTask) {
      return error404(res, "Task not found");
    }
    const activityId = await TaskActivity.create({
      taskId: id,
      title: `Priority changed to the ${priority}`,
      event: priority,
      activityById: req.userId,
    });
    await Task.findByIdAndUpdate(id, {
      $push: {
        activityIds: activityId._id,
      },
    });
    return status200(res, `Priority changed to ${priority}`);
  } catch (err) {
    return next(err);
  }
};

//Change status
const changeStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updatedTask = await Task.findByIdAndUpdate(id, {
      status,
    });
    if (!updatedTask) {
      return error404(res, "Task not found");
    }
    const activityId = await TaskActivity.create({
      taskId: id,
      title: `Status changed to the ${status}`,
      event: status,
      activityById: req.userId,
    });
    await Task.findByIdAndUpdate(id, {
      $push: {
        activityIds: activityId._id,
      },
    });
    return status200(res, `Status changed to ${status}`);
  } catch (err) {
    return next(err);
  }
};

//Delete task
const deleteTask = async (req, res, next) => {
  const { id } = req.params;
  try {
    const taskExist = await Task.findById(id);
    if (!taskExist) {
      return error404(res, "Task not found");
    }
    // Delete related task activities
    await TaskActivity.deleteMany({ taskId: id });
    // Delete associated comments and their pictures
    if (taskExist.commentIds && taskExist.commentIds.length > 0) {
      // Fetch all comments associated with the task
      const comments = await TaskComment.find({
        _id: { $in: taskExist.commentIds },
      });
      // Delete pictures from S3
      for (let comment of comments) {
        if (comment.picture && comment.picture.key) {
          await deleteObjFromBucket({
            Bucket: config.bucketName,
            Key: comment.picture.key,
          });
        }
      }
      // Delete comments
      await TaskComment.deleteMany({ _id: { $in: taskExist.commentIds } });
    }
    await Task.deleteOne({ _id: id });
    return status200(res, `Task deleted successfully`);
  } catch (err) {
    return next(err);
  }
};

//Task detail
const taskDetail = async (req, res, next) => {
  const { id } = req.params;

  try {
    async function fetchAllUsers() {
      try {
        const response = await axios.get(
          `${config.authServiceBaseUrl}/users/get_many?network_id=${config.networkId}`,
          {
            headers: {
              Authorization: `Bearer ${req.token}`,
            },
          }
        );
        if (
          response &&
          response.data &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          if (Array.isArray(response.data[0]) && response.data[0].length > 0) {
            return response.data[0];
          } else {
            return [];
          }
        } else return [];
      } catch (err) {
        throw new Error("Error in Auth Service");
      }
    }
    async function attachUserDetails(task, allUsers) {
      const findUser = (userId) => {
        const user = allUsers.find((user) => user.user_id === userId);
        if (user) {
          return {
            first_name: user?.first_name,
            last_name: user?.last_name,
            email: user?.email,
            user_id: user?.user_id,
          };
        }
        return null;
      };

      const createdByUser = findUser(task?.createdById);

      const assignToUsers = task.assignToIds.map((userId) => findUser(userId));

      const commentUsers = task.commentIds.map((comment) =>
        findUser(comment?.commentById)
      );

      const activityUsers = task.activityIds.map((activity) =>
        findUser(activity?.activityById)
      );

      // Modified response for the Task Detail Screen with User information from Auth Service
      return {
        ...task,
        createdById: createdByUser,
        assignToIds: assignToUsers,
        commentIds: task.commentIds.map((comment, index) => ({
          ...comment,
          commentById: commentUsers[index],
        })),
        activityIds: task.activityIds.map((activity, index) => ({
          ...activity,
          activityById: activityUsers[index],
        })),
      };
    }

    const singleTask = await Task.findById(id)
      .select("-__v")
      .populate([
        {
          path: "clientId",
          select: "-__v",
        },
        {
          path: "storeId",
          select: "-__v",
        },
        {
          path: "activityIds",
          select: "-__v",
        },
        {
          path: "commentIds",
          select: "-__v",
        },
        {
          path: "serviceId",
          select: "-__v",
        },
        // {
        //   path: "assignToIds",
        // },
        // {
        //   path: "createdById",
        // },
      ])
      .lean();

    if (!singleTask) {
      return error404(res, "Task not found");
    }

    //Modify response with Auth Service Response
    const allUsers = await fetchAllUsers();

    if (!allUsers.length) {
      return error404(res, "No users returned from Auth Service");
    }

    const modifiedTask = await attachUserDetails(singleTask, allUsers);
    return success(res, "200", "Success", modifiedTask);
  } catch (err) {
    if (err.message === "Error in Auth Service") {
      return error500(res, err.message);
    }
    return next(err);
  }
};

//Comment on task
const commentOnTask = async (req, res, next) => {
  const { id } = req.params;
  const { comment } = req.body;
  try {
    const existTask = await Task.findById(id).lean();

    if (!existTask) {
      return error404(res, "Task not found");
    }

    let picture = {
      name: "",
      format: "",
      location: "",
      key: "",
    };
    if (req.files && req.files.file && req.files.file.length > 0) {
      let file = req.files.file[0];
      const uploadParams = {
        Bucket: config.bucketName,
        Key: `task/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      //UploadToBucket
      const uploadResult = await uploadFileToBucket(uploadParams);

      picture = {
        name: file.originalname,
        format: file.mimetype,
        location: uploadResult.location,
        key: uploadResult.key,
      };

      const newComment = await TaskComment.create({
        taskId: id,
        title: comment,
        picture: picture,
        commentById: req.userId,
      });

      await Task.findByIdAndUpdate(id, {
        $push: { commentIds: newComment._id },
      });

      return status200(res, "New comment added in task");
    } else {
      return error400(res, "Photo of the comment is required");
    }
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  addTask,
  addAssignee,
  allTasks,
  taskDetail,
  commentOnTask,
  changePriority,
  changeStatus,
  deleteTask,
  editTask,
};
