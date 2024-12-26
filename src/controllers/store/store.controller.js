//Model
const Client = require("../../models/client/client.model.js");
const Store = require("../../models/store/store.model.js");
const StoreComment = require("../../models/store/storeComment.model.js");
const StoreContactInfo = require("../../models/store/storeContactInfo.model.js");
const Task = require("../../models/task/task.model.js");
//Responses and errors
const {
  error500,
  error404,
  error400,
  error409,
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
const config = require("../../config/index.js");

//Add store
const addStore = async (req, res, next) => {
  const { id } = req.params;
  const body = prototypeRemover(req.body);
  const {
    route,
    salesman,
    contactInfo: contactInfoStringify,
    devices: devicesStringify,
    comment,
  } = body;
  try {
    // Check if client already exist with this name
    const clientExist = await Client.findById(id).lean();
    if (!clientExist) {
      return error404(res, "Client not found");
    }

    //Parse the Stringify Array's
    const devices = JSONParser(devicesStringify);
    const contactInfo = JSONParser(contactInfoStringify);

    //Create record of store
    const store = await Store.create({
      ...req.body,
      clientId: clientExist._id,
      routeId: route,
      salesmanId: salesman,
      deviceIds: devices,
    });

    //Create records in StoreContactInfo Model
    const contactInfoIds = await Promise.all(
      contactInfo.map(async (info) => {
        const newContactInfo = await StoreContactInfo.create({
          storeId: store._id,
          name: info.name,
          email: info.email,
          homePhone: info.homePhone,
          mobilePhone: info.mobilePhone,
          workPhone: info.workPhone,
        });
        return newContactInfo._id;
      })
    );

    //Upload store comment picture to bucket
    if (comment) {
      let picture = {};
      if (req.files && req.files.file && req.files.file.length) {
        let file = req.files.file[0];
        const uploadParams = {
          Bucket: config.bucketName,
          Key: `store/${Date.now()}_${file.originalname}`,
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
      //Create record of storeComment model
      const commentId = await StoreComment.create({
        storeId: store._id,
        title: comment,
        picture: picture,
        commentById: req.userId,
      });
      await Store.findByIdAndUpdate(store._id, {
        commentIds: commentId._id,
      });
    }
    //Add in the client model store id
    await Client.findByIdAndUpdate(id, { $push: { storeIds: store._id } });
    await Store.findByIdAndUpdate(store._id, {
      contactInfoIds: contactInfoIds,
    });

    return status200(res, `Store created in ${clientExist.name}`);
  } catch (err) {
    return next(err);
  }
};

//Edit store
const editStore = async (req, res, next) => {
  const { id } = req.params;
  const body = prototypeRemover(req.body);
  const {
    route,
    salesman,
    contactInfo: contactInfoStringify,
    devices: devicesStringify,
  } = body;
  try {
    if (req.files.file.length) {
      //Check if store exists
      const storeExist = await Store.findById(id).lean();
      if (!storeExist) {
        return error404(res, "Store not found");
      }

      //Parse the Stringify Array's
      const devices = JSONParser(devicesStringify);
      const contactInfo = JSONParser(contactInfoStringify);

      //Remove clientInfo from relevant models and create new
      await StoreContactInfo.deleteMany({ storeId: id });
      await Store.findByIdAndUpdate(
        id,
        { $set: { contactInfoIds: [] } },
        { new: true }
      );
      const contactInfoIds = await Promise.all(
        contactInfo.map(async (info) => {
          const newContactInfo = await StoreContactInfo.create({
            storeId: id,
            name: info.name,
            email: info.email,
            homePhone: info.homePhone,
            mobilePhone: info.mobilePhone,
            workPhone: info.workPhone,
          });
          return newContactInfo._id;
        })
      );

      //Create record of client with comment and contactInfo
      await Store.updateOne(
        { _id: id },
        {
          ...req.body,
          routeId: route,
          salesmanId: salesman,
          contactInfoIds: contactInfoIds,
          deviceIds: devices,
          // commentIds: commentId._id,
        }
      );
      return status200(res, "Store updated successfully");
    } else {
      error400(res, "Photo for comment is required");
    }
  } catch (err) {
    return next(err);
  }
};

//All store's
// const getAllStores = async (req, res, next) => {
//   try {
//     const stores = await Store.find({}).populate({

//     });
//     return success(res, "200", "Success", stores);
//   } catch (err) {
//     return next(err)
//   }
// };

//Change status of store
const changeStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await Store.findByIdAndUpdate(id, {
      status,
    });
    return status200(res, `Store status changed to ${status}`);
  } catch (err) {
    return next(err);
  }
};

//Decline store
const declineStore = async (req, res, next) => {
  const { id } = req.params;
  const { taskId } = req.body;

  try {
    const taskExists = await Task.findOne({
      _id: taskId,
      storeId: id,
    });

    if (taskExists) {
      await Store.findByIdAndUpdate(id, {
        declined: true,
      });
      taskExists.status = "Declined";
      taskExists.save();
      return status200(res, `Store declined`);
    } else {
      return error409(res, "Task not found");
    }
  } catch (err) {
    return next(err);
  }
};

//Delete store
const deleteStore = async (req, res, next) => {
  const { id } = req.params;
  try {
    const storeExist = await Store.findById(id).lean();
    if (!storeExist) {
      return error404(res, "Store not found");
    }

    const storeComments = await StoreComment.find({ storeId: id });
    for (let storeComment of storeComments) {
      await deleteObjFromBucket({
        Bucket: config.bucketName,
        Key: storeComment.picture.key,
      });
    }

    await StoreComment.deleteMany({ storeId: id });
    await StoreContactInfo.deleteMany({ storeId: id });
    await Store.deleteOne({ _id: id });
    await Client.updateMany({ storeIds: id }, { $pull: { storeIds: id } });
    return status200(res, `Store deleted successfully`);
  } catch (err) {
    return next(err);
  }
};

//Comment on store
const commentOnStore = async (req, res, next) => {
  const { id } = req.params;
  const { comment } = req.body;
  try {
    const existStore = await Store.findById(id).lean();

    if (!existStore) {
      return error404(res, "Store not found");
    }

    if (req.files.file.length) {
      let file = req.files.file[0];
      const uploadParams = {
        Bucket: config.bucketName,
        Key: `store/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      //UploadToBucket
      const uploadResult = await uploadFileToBucket(uploadParams);

      const newComment = await StoreComment.create({
        storeId: id,
        title: comment,
        picture: {
          name: file.originalname,
          format: file.mimetype,
          location: uploadResult.location,
          key: uploadResult.key,
        },
        commentById: req.userId,
      });

      await Store.findByIdAndUpdate(id, {
        $push: { commentIds: newComment._id },
      });

      return status200(res, "New comment added in store");
    } else {
      return error400(res, "Photo of the comment is required");
    }
  } catch (err) {
    return next(err);
  }
};

//Store detail
const storeDetail = async (req, res, next) => {
  const { id } = req.params;
  try {
    const singleStore = await Store.findById(id)
      .select("-__v")
      .populate([
        {
          path: "commentIds",
          select: "-__v",
        },
      ])
      .lean();
    return success(res, "200", "Success", singleStore);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  addStore,
  editStore,
  // getAllStores,
  deleteStore,
  commentOnStore,
  storeDetail,
  changeStatus,
  declineStore,
};
