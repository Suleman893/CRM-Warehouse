//Model
const config = require("../../../config/index.js");
const Client = require("../../../models/client/client.model.js");
const Route = require("../../../models/setting/route.model.js");
//Response and errors
const {
  error500,
  error409,
  error404,
} = require("../../../services/helpers/errors.js");
const { status200, success } = require("../../../services/helpers/response.js");
const axios = require("axios");
const mongoose = require("mongoose");

//Add route
const addRoute = async (req, res, next) => {
  const { name } = req.body;
  try {
    const alreadyExists = await Route.findOne({ name }).lean();

    if (alreadyExists) {
      return error409(res, "Route with this name already exists");
    }
    await Route.create({ ...req.body });
    return status200(res, `Route created successfully`);
  } catch (err) {
    return next(err);
  }
};

//Get all routes
const allRoutes = async (req, res, next) => {
  const { page = 1, pageSize = 10 } = req.query;
  try {
    let query = {};

    const routes = await Route.find(query)
      .select("-__v")
      .lean()
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));

    const total = await Route.countDocuments(query);
    const totalPages = Math.ceil(total / pageSize);

    const response = {
      routes,
      total,
      totalPages,
    };

    return success(res, "200", "Success", response);
  } catch (err) {
    return next(err);
  }
};

//Edit route
const editRoute = async (req, res, next) => {
  const { id } = req.params;
  try {
    const routeExist = await Route.findByIdAndUpdate(id, { ...req.body });

    if (!routeExist) {
      return error404(res, "Route with this id not found");
    }

    return status200(res, `Route edited successfully`);
  } catch (err) {
    return next(err);
  }
};

//Delete route
const deleteRoute = async (req, res, next) => {
  const { id } = req.params;
  try {
    const routeExist = await Route.findByIdAndDelete(id);

    if (!routeExist) {
      return error404(res, "Route with this id not found");
    }

    return status200(res, `Route deleted successfully`);
  } catch (err) {
    return next(err);
  }
};

//Change status
const changeStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const statusUpdated = await Route.findByIdAndUpdate(id, {
      status,
    });
    if (!statusUpdated) {
      return error404(res, "Route with this id not found");
    }
    return status200(res, `Route status changed to ${status}`);
  } catch (err) {
    return next(err);
  }
};

//Get all routes for dropdown
const allRoutesForDropdown = async (req, res, next) => {
  try {
    const activeRoutes = await Route.find({ status: "Active" })
      .select("-__v")
      .lean();
    return success(res, "200", "Success", activeRoutes);
  } catch (err) {
    return next(err);
  }
};

//Sync route
const syncRoute = async (req, res, next) => {
  try {
    let page = 1;
    const pageSize = 500;
    let totalPages;
    let recordsSynced = 0;

    while (true) {
      let response;
      try {
        response = await axios.get(`${config.crmServiceBaseUrl}/getRoutes`, {
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
        const bulkOps = response.data.data.map((routeData) => {
          const { _id, ...otherData } = routeData;
          return {
            updateOne: {
              filter: { _id: new mongoose.Types.ObjectId(_id) },
              update: { $set: otherData },
              upsert: true,
            },
          };
        });

        await Route.bulkWrite(bulkOps, { ordered: false });
        //Just to check the record count
        const itemsProcessed = response.data.data.length; // Count how many items we received in the current page
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
  addRoute,
  allRoutes,
  editRoute,
  deleteRoute,
  changeStatus,
  allRoutesForDropdown,
  syncRoute,
};
