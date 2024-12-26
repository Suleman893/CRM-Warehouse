//Model
const Order = require("../../models/order/order.model");
const OrderComment = require("../../models/order/orderComment.model.js");
const OrderActivity = require("../../models/order/orderActivity.model.js");
//Responses and errors
const {
  error500,
  error404,
  error409,
  error400,
} = require("../../services/helpers/errors");
const { status200, success } = require("../../services/helpers/response");
//helpers
const {
  uploadFileToBucket,
  deleteObjFromBucket,
} = require("../../services/helpers/awsHelper");
const axios = require("axios");
const config = require("../../config/index.js");

//Add order
const addOrder = async (req, res, next) => {
  const { orderNo, client, store, task, materials } = req.body;
  try {
    const orderExists = await Order.findOne({ orderNo });
    if (orderExists) {
      return error409(res, "Order with this order number already exist");
    }

    await Order.create({
      ...req.body,
      clientId: client,
      storeId: store,
      taskId: task,
      materials: materials,
      createdById: req.userId,
    });

    return status200(res, "Order created successfully");
  } catch (err) {
    return next(err);
  }
};

//Edit order
const editOrder = async (req, res, next) => {
  const { id } = req.params;
  try {
    const orderExists = await Order.findByIdAndUpdate(id, { ...req.body });

    if (!orderExists) {
      return error404(res, "Order not found");
    }
    return status200(res, `Order edited successfully`);
  } catch (err) {
    return next(err);
  }
};

//All order's
const allOrders = async (req, res, next) => {
  const { status, page = 1, pageSize = 10 } = req.query;

  //Query object
  let query = {};

  if (status) {
    query.status = status;
  }

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

    async function attachUserDetails(order, allUsers) {
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

      const createdByUser = findUser(order?.createdById);
      // Modified response for the Order Detail Screen with User information from Auth Service
      return {
        ...order,
        createdById: createdByUser,
      };
    }

    const orders = await Order.find(query)
      .select("-__v")
      .lean()
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
          path: "taskId",
          select: "-__v",
        },
      ])
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));

    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / pageSize);

    //Modify response with Auth Service Response
    const allUsers = await fetchAllUsers();

    if (!allUsers.length) {
      return error404(res, "No users returned from Auth Service");
    }

    const modifiedOrder = await Promise.all(
      orders.map((order) => attachUserDetails(order, allUsers))
    );

    const response = {
      orders: modifiedOrder,
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

//Get order
const orderById = async (req, res, next) => {
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

    async function attachUserDetails(order, allUsers) {
      // Helper function to find user details
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

      const createdByUser = findUser(order?.createdById);

      const commentUsers = order.commentIds.map((comment) =>
        findUser(comment.commentById)
      );

      const activityUsers = order.activityIds.map((activity) =>
        findUser(activity.activityById)
      );

      // Modified response for the Order Detail Screen with User information from Auth Service
      return {
        ...order,
        createdById: createdByUser,
        commentIds: order.commentIds.map((comment, index) => ({
          ...comment,
          commentById: commentUsers[index],
        })),
        activityIds: order.activityIds.map((activity, index) => ({
          ...activity,
          activityById: activityUsers[index],
        })),
      };
    }

    const singleOrder = await Order.findById(id)
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
          path: "taskId",
          select: "-__v",
          populate: {
            path: "serviceId",
            select: "-__v",
          },
        },
        {
          path: "activityIds",
          select: "-__v",
        },
        {
          path: "materials.materialId",
          select: "-__v -documents",
        },
        {
          path: "commentIds",
          select: "-__v",
        },
      ])
      .lean();

    if (!singleOrder) {
      return error404(res, "Order not found");
    }

    //Modify response with Auth Service Response
    const allUsers = await fetchAllUsers();

    if (!allUsers.length) {
      return error404(res, "No users returned from Auth Service");
    }

    const modifiedOrder = await attachUserDetails(singleOrder, allUsers);
    return success(res, "200", "Success", modifiedOrder);
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

//Change status
const changeStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updatedOrder = await Order.findByIdAndUpdate(id, {
      status,
    });
    if (!updatedOrder) {
      return error404(res, "Order not found");
    }
    const activityId = await OrderActivity.create({
      orderId: id,
      title: `Status changed to the ${status}`,
      event: status,
      activityById: req.userId,
    });
    await Order.findByIdAndUpdate(id, {
      $push: {
        activityIds: activityId._id,
      },
    });
    return status200(res, `Order status changed to ${status}`);
  } catch (err) {
    return next(err);
  }
};

//Change priority
const changePriority = async (req, res, next) => {
  const { id } = req.params;
  const { priority } = req.body;
  try {
    const updatedOrder = await Order.findByIdAndUpdate(id, {
      priority,
    });
    if (!updatedOrder) {
      return error404(res, "Order not found");
    }
    const activityId = await OrderActivity.create({
      orderId: id,
      title: `Priority changed to the ${priority}`,
      event: priority,
      activityById: req.userId,
    });
    await Order.findByIdAndUpdate(id, {
      $push: {
        activityIds: activityId._id,
      },
    });
    return status200(res, `Priority changed to ${priority}`);
  } catch (err) {
    return next(err);
  }
};

//Comment on order
const commentOnOrder = async (req, res, next) => {
  const { id } = req.params;
  const { comment } = req.body;
  try {
    const existOrder = await Order.findById(id).lean();

    if (!existOrder) {
      return error404(res, "Order not found");
    }

    if (req.files.file.length) {
      let file = req.files.file[0];
      const uploadParams = {
        Bucket: config.bucketName,
        Key: `order/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      //UploadToBucket
      const uploadResult = await uploadFileToBucket(uploadParams);

      const newComment = await OrderComment.create({
        orderId: id,
        title: comment,
        picture: {
          name: file.originalname,
          format: file.mimetype,
          location: uploadResult.location,
          key: uploadResult.key,
        },
        commentById: req.userId,
      });

      await Order.findByIdAndUpdate(id, {
        $push: { commentIds: newComment._id },
      });

      return status200(res, "New comment added in order");
    } else {
      return error400(res, "Photo of comment is required");
    }
  } catch (err) {
    return next(err);
  }
};

//Delete order
const deleteOrder = async (req, res, next) => {
  const { id } = req.params;
  try {
    const orderExists = await Order.findById(id).lean();
    if (!orderExists) {
      return error404(res, "Order not found");
    }
    const orderComments = await OrderComment.find({ orderId: id });
    for (let orderComment of orderComments) {
      await deleteObjFromBucket({
        Bucket: config.bucketName,
        Key: orderComment.picture.key,
      });
    }

    await OrderComment.deleteMany({ orderId: id });
    await OrderActivity.deleteMany({ orderId: id });
    await Order.deleteOne({ _id: id });
    return status200(res, `Order deleted successfully`);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  addOrder,
  allOrders,
  orderById,
  changeStatus,
  changePriority,
  commentOnOrder,
  editOrder,
  deleteOrder,
};
