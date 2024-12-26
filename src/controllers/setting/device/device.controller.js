//Model
const Device = require("../../../models/setting/device.model.js");
//Response and errors
const {
  error500,
  error409,
  error404,
} = require("../../../services/helpers/errors.js");
const { status200, success } = require("../../../services/helpers/response.js");
//helpers
const axios = require("axios");
const mongoose = require("mongoose");
const config = require("../../../config/index.js");

//Add device
const addDevice = async (req, res, next) => {
  const { name } = req.body;
  try {
    const alreadyExists = await Device.findOne({ name }).lean();

    if (alreadyExists) {
      return error409(res, "Device with this name already exists");
    }

    await Device.create({ ...req.body });
    return status200(res, `Device created successfully`);
  } catch (err) {
    return next(err);
  }
};

//All devices
const allDevices = async (req, res, next) => {
  const { page = 1, pageSize = 10 } = req.query;
  try {
    let query = {};

    const devices = await Device.find(query)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));

    const total = await Device.countDocuments(query);
    const totalPages = Math.ceil(total / pageSize);

    const response = {
      devices,
      total,
      totalPages,
    };
    return success(res, "200", "Success", response);
  } catch (err) {
    return next(err);
  }
};

//Edit devices
const editDevice = async (req, res, next) => {
  const { id } = req.params;
  try {
    const deviceExist = await Device.findByIdAndUpdate(id, { ...req.body });

    if (!deviceExist) {
      return error404(res, "Device not found");
    }
    return status200(res, `Device edited successfully`);
  } catch (err) {
    return next(err);
  }
};

//Delete device
const deleteDevice = async (req, res, next) => {
  const { id } = req.params;
  try {
    const deviceExist = await Device.findByIdAndDelete(id);
    if (!deviceExist) {
      return error404(res, "Device not found");
    }
    return status200(res, `Device deleted successfully`);
  } catch (err) {
    return next(err);
  }
};

//Change status of device
const changeStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updatedStatus = await Device.findByIdAndUpdate(id, {
      status,
    });

    if (!updatedStatus) {
      return error404(res, "Device not found");
    }
    return status200(res, `Device status changed to ${status}`);
  } catch (err) {
    return next(err);
  }
};

//Sync devices
const syncDevice = async (req, res, next) => {
  try {
    let page = 1;
    const pageSize = 500;
    let totalPages;
    let recordsSynced = 0;

    while (true) {
      let response;
      try {
        response = await axios.get(`${config.crmServiceBaseUrl}/getDevices`, {
          headers: {
            Authorization: `Bearer ${req.token}`,
          },
          params: {
            page,
            pageSize,
          },
        });
      } catch (err) {
        return new Error("Server error");
      }

      if (response.data) {
        const bulkOps = response.data.data.map((deviceData) => {
          const { _id, ...otherData } = deviceData;
          return {
            updateOne: {
              filter: { _id: new mongoose.Types.ObjectId(_id) },
              update: { $set: otherData },
              upsert: true,
            },
          };
        });

        await Device.bulkWrite(bulkOps, { ordered: false });
        //Just to check the record count
        const itemsProcessed = response.data.data.length;
        recordsSynced += itemsProcessed;
        totalPages = response.data.totalPages;
        if (page >= totalPages) break;
      }
      page++;
    }

    return status200(res, `Synced successfully`);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  addDevice,
  allDevices,
  editDevice,
  deleteDevice,
  changeStatus,
  syncDevice,
};
