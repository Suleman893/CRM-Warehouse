//Model
const Client = require("../../models/client/client.model.js");
const ClientComment = require("../../models/client/clientComment.model.js");
const ClientContactInfo = require("../../models/client/clientContactInfo.model.js");
const Store = require("../../models/store/store.model.js");
const StoreComment = require("../../models/store/storeComment.model.js");
const StoreContactInfo = require("../../models/store/storeContactInfo.model.js");
const Task = require("../../models/task/task.model.js");
//Responses and errors
const {
  error500,
  error409,
  error404,
  error400,
} = require("../../services/helpers/errors");
const { status200, success } = require("../../services/helpers/response");
//helpers
const {
  toPlainObject,
  JSONParser,
  prototypeRemover,
} = require("../../services/helpers/commonHelpers.js");
const {
  uploadFileToBucket,
  deleteObjFromBucket,
} = require("../../services/helpers/awsHelper.js");
const axios = require("axios");
const mongoose = require("mongoose");
const config = require("../../config/index.js");

//Add client
const addClient = async (req, res, next) => {
  const body = prototypeRemover(req.body);
  const {
    name,
    route,
    salesman,
    contactInfo: contactInfoStringify,
    devices: devicesStringify,
    comment,
  } = body;
  try {
    // Check if client already exist with this name
    const clientExists = await Client.findOne({ name: name });
    if (clientExists) {
      return error409(res, "Client with this name already exists");
    }

    //Parse the Stringify Array's
    const devices = JSONParser(devicesStringify);
    const contactInfo = JSONParser(contactInfoStringify);
    //Create record of client
    const client = await Client.create({
      ...req.body,
      routeId: route,
      salesmanId: salesman,
      deviceIds: devices,
    });

    //Create records in ClientContactInfo Model
    const contactInfoIds = await Promise.all(
      contactInfo.map(async (info) => {
        const newContactInfo = await ClientContactInfo.create({
          clientId: client._id,
          name: info.name,
          email: info.email,
          phoneNumbers: info.phoneNumbers.map((phoneNo) => {
            return phoneNo;
          }),
        });
        return newContactInfo._id;
      })
    );

    //Upload client comment picture to bucket
    if (comment) {
      let picture = {};
      if (req.files && req.files.file && req.files.file.length) {
        let file = req.files.file[0];
        const uploadParams = {
          Bucket: config.bucketName,
          Key: `client/${Date.now()}_${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        const uploadResult = await uploadFileToBucket(uploadParams);
        //Set picture details
        picture = {
          name: file.originalname,
          format: file.mimetype,
          location: uploadResult.location,
          key: uploadResult.key,
        };
      }
      //Create record of clientComment model
      const commentId = await ClientComment.create({
        clientId: client._id,
        title: comment,
        picture: picture,
        commentById: req.userId,
      });
      await Client.findByIdAndUpdate(client._id, {
        commentIds: commentId._id,
      });
    }
    await Client.findByIdAndUpdate(client._id, {
      contactInfoIds: contactInfoIds,
    });
    return status200(res, "Client created successfully");
  } catch (err) {
    return next(err);
  }
};

//Edit client
const editClient = async (req, res, next) => {
  const { id } = req.params;
  const body = prototypeRemover(req.body);
  const {
    route,
    salesman,
    contactInfo: contactInfoStringify,
    devices: devicesStringify,
  } = body;
  try {
    // Check if client exists
    const clientExists = await Client.findById(id).lean();
    if (!clientExists) {
      return error409(res, "Client not found");
    }

    //Parse the Stringify Array's
    const devices = JSONParser(devicesStringify);
    const contactInfo = JSONParser(contactInfoStringify);

    //Remove clientInfo from relevant models and create new
    await ClientContactInfo.deleteMany({ clientId: id });
    await Client.findByIdAndUpdate(
      id,
      { $set: { contactInfoIds: [] } },
      { new: true }
    );
    const contactInfoIds = await Promise.all(
      contactInfo.map(async (info) => {
        const newContactInfo = await ClientContactInfo.create({
          clientId: id,
          name: info.name,
          email: info.email,
          phoneNumbers: info.phoneNumbers.map((phoneNo) => {
            return phoneNo;
          }),
        });
        return newContactInfo._id;
      })
    );

    //Create record of client with comment and contactInfo
    await Client.updateOne(
      { _id: id },
      {
        ...req.body,
        routeId: route,
        salesmanId: salesman,
        contactInfoIds: contactInfoIds,
        deviceIds: devices,
      }
    );
    return status200(res, "Client updated successfully");
  } catch (err) {
    return next(err);
  }
};

//All client's
const allClients = async (req, res, next) => {
  const { status, text, page = 1, pageSize = 10 } = req.query;

  //Query object
  let query = {};

  if (status) {
    query.status = status;
  }

  if (text) {
    query.name = { $regex: text, $options: "i" };
  }

  try {
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
    async function attachUserDetails(client, allUsers) {
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
      const salesmanUser = findUser(client?.salesmanId);
      return {
        ...client,
        salesmanId: salesmanUser,
      };
    }

    const clients = await Client.find(query)
      .select("-__v")
      .lean()
      .populate([
        {
          path: "routeId",
          select: "-__v",
        },
        {
          path: "contactInfoIds",
          select: "-__v",
        },
        {
          path: "storeIds",
          select: "-__v",
        },
        {
          path: "deviceIds",
          select: "-__v",
        },
      ])
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));

    const total = await Client.countDocuments(query);
    const totalPages = Math.ceil(total / pageSize);

    //Modify response with Auth Service Response
    const allUsers = await fetchAllUsers();

    if (!allUsers.length) {
      return error404(res, "No users returned from Auth Service");
    }

    const modifiedClients = await Promise.all(
      clients.map((client) => attachUserDetails(client, allUsers))
    );

    const response = {
      clients: modifiedClients,
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

//Client for dropdown
const allClientsForDropdown = async (req, res, next) => {
  try {
    const clients = await Client.find()
      .select("-__v -deviceIds -contactInfoIds -commentIds")
      .populate([
        {
          path: "storeIds",
          select: "-__v -contactInfoIds -deviceIds -commentIds",
        },
      ]);
    return success(res, "200", "Success", clients);
  } catch (err) {
    return next(err);
  }
};

//Client detail
const clientDetail = async (req, res, next) => {
  const { id } = req.params;
  try {
    const client = await Client.findById(id)
      .select("-__v")
      .populate([
        {
          path: "commentIds",
          select: "-__v",
        },
      ])
      .lean();

    if (!client) {
      return error404(res, "Client not found");
    }

    return success(res, "200", "Success", client);
  } catch (err) {
    return next(err);
  }
};

//Comment on client
const commentOnClient = async (req, res, next) => {
  const { id } = req.params;
  const { comment } = req.body;
  try {
    const existClient = await Client.findById(id).lean();

    if (!existClient) {
      return error404(res, "Client not found");
    }

    if (req.files.file.length) {
      let file = req.files.file[0];
      const uploadParams = {
        Bucket: config.bucketName,
        Key: `client/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      //UploadToBucket
      const uploadResult = await uploadFileToBucket(uploadParams);

      const newComment = await ClientComment.create({
        clientId: id,
        title: comment,
        picture: {
          name: file.originalname,
          format: file.mimetype,
          location: uploadResult.location,
          key: uploadResult.key,
        },
        commentById: req.userId,
      });

      await Client.findByIdAndUpdate(id, {
        $push: { commentIds: newComment._id },
      });

      return status200(res, "New comment added in client");
    } else {
      return error400(res, "Photo of comment is required");
    }
  } catch (err) {
    return next(err);
  }
};

//Change status
const changeStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await Client.findByIdAndUpdate(id, {
      status,
    });
    return status200(res, `Client status changed to ${status}`);
  } catch (err) {
    return next(err);
  }
};

//Decline client
const declineClient = async (req, res, next) => {
  const { id } = req.params;
  const { taskId } = req.body;

  try {
    const taskExists = await Task.findOne({
      _id: taskId,
      clientId: id,
    });

    if (taskExists) {
      await Client.findByIdAndUpdate(id, {
        declined: true,
      });
      taskExists.status = "Declined";
      taskExists.save();
      return status200(res, `Client declined successfully`);
    } else {
      return error409(res, "Task not found");
    }
  } catch (err) {
    return next(err);
  }
};

//Delete client
const deleteClient = async (req, res, next) => {
  const { id } = req.params;
  try {
    const clientExist = await Client.findById(id).lean();
    if (!clientExist) {
      return error404(res, "Client not found");
    }

    // Delete stores related information of the client
    if (clientExist.storeIds && clientExist.storeIds.length > 0) {
      for (let storeId of clientExist.storeIds) {
        const storeComments = await StoreComment.find({ storeId: storeId });
        for (let storeComment of storeComments) {
          if (storeComment.picture && storeComment.picture.key) {
            await deleteObjFromBucket({
              Bucket: config.bucketName,
              Key: storeComment.picture.key,
            });
          }
        }
        // Delete store-related comments and contact info
        await StoreComment.deleteMany({ storeId: storeId });
        await StoreContactInfo.deleteMany({ storeId: storeId });
        // Delete the store itself
        await Store.deleteOne({ _id: storeId });
      }
    }

    // Delete client comments and their pictures
    const clientComments = await ClientComment.find({ clientId: id });
    for (let clientComment of clientComments) {
      if (clientComment.picture && clientComment.picture.key) {
        await deleteObjFromBucket({
          Bucket: config.bucketName,
          Key: clientComment.picture.key,
        });
      }
    }

    // Delete client-related comments and contact info
    await ClientComment.deleteMany({ clientId: id });
    await ClientContactInfo.deleteMany({ clientId: id });
    // Finally, delete the client itself
    await Client.deleteOne({ _id: id });

    return status200(res, `Client deleted successfully`);
  } catch (err) {
    return next(err);
  }
};

//Sync client
const syncClient = async (req, res, next) => {
  try {
    let page = 1;
    const pageSize = 500;
    let totalPages;
    let recordsSynced = 0;

    while (true) {
      let response;
      try {
        response = await axios.get(`${config.crmServiceBaseUrl}/getClients`, {
          headers: {
            Authorization: `Bearer ${req.token}`,
          },
          params: {
            page, // send the current page
            pageSize, // send the page size
          },
        });
      } catch (err) {
        throw new Error("Server error");
      }

      if (response.data) {
        const bulkOps = response.data.data.map((clientData) => {
          const { _id, ...otherData } = clientData;
          return {
            updateOne: {
              filter: { _id: new mongoose.Types.ObjectId(_id) },
              update: { $set: otherData },
              upsert: true,
            },
          };
        });

        await Client.bulkWrite(bulkOps, { ordered: false });
        //Just to check the record count
        console.log("The response", response.data.data.length);
        const itemsProcessed = response.data.data.length; // Count how many items we received in the current page
        recordsSynced += itemsProcessed;

        totalPages = response.data.totalPages;
        if (page >= totalPages) break;
      }

      page++;
    }

    return status200(res, "Synced successfully");
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  addClient,
  editClient,
  allClients,
  allClientsForDropdown,
  commentOnClient,
  clientDetail,
  changeStatus,
  declineClient,
  deleteClient,
  syncClient,
};
