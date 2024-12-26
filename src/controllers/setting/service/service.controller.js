//Model
const Service = require("../../../models/setting/service.model.js");
//Response and errors
const {
  error500,
  error409,
  error404,
} = require("../../../services/helpers/errors.js");
const { status200, success } = require("../../../services/helpers/response.js");

//Add service
const addService = async (req, res, next) => {
  const { name } = req.body;
  try {
    const alreadyExists = await Service.findOne({ name }).lean();
    if (alreadyExists) {
      return error409(res, "Service with this name already exists");
    }
    await Service.create({ ...req.body });

    return status200(res, `Service created successfully`);
  } catch (err) {
    return next(err);
  }
};

//Get all services
const allServices = async (req, res, next) => {
  const { page = 1, pageSize = 10 } = req.query;
  try {
    let query = {};

    const services = await Service.find()
      .select("-__v")
      .lean()
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));

    const total = await Service.countDocuments(query);
    const totalPages = Math.ceil(total / pageSize);

    const response = {
      services,
      total,
      totalPages,
    };

    return success(res, "200", "Success", response);
  } catch (err) {
    return next(err);
  }
};

//Get all services for dropdown
const allServicesForDropdown = async (req, res, next) => {
  try {
    const services = await Service.find({ status: "Active" })
      .select("-__v")
      .lean();

    return success(res, "200", "Success", services);
  } catch (err) {
    return next(err);
  }
};

//Edit service
const editService = async (req, res, next) => {
  const { id } = req.params;
  try {
    const serviceExist = await Service.findByIdAndUpdate(id, {
      ...req.body,
    }).lean();

    if (!serviceExist) {
      return error404(res, "Service not found");
    }

    return status200(res, `Service edited successfully`);
  } catch (err) {
    return next(err);
  }
};

//Delete service
const deleteService = async (req, res, next) => {
  const { id } = req.params;
  try {
    const serviceExists = await Service.findByIdAndDelete(id).lean();
    if (!serviceExists) {
      return error404(res, "Service not found");
    }
    return status200(res, `Service deleted successfully`);
  } catch (err) {
    return next(err);
  }
};

//Change status
const changeStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const statusUpdated = await Service.findByIdAndUpdate(id, {
      status,
    }).lean();
    if (!statusUpdated) {
      return error404(res, "Service not found");
    }
    return status200(res, `Service status changed to ${status}`);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  addService,
  allServices,
  editService,
  deleteService,
  changeStatus,
  allServicesForDropdown,
};
