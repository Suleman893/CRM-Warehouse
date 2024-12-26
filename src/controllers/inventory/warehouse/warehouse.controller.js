//Model
const Warehouse = require("../../../models/inventory/warehouse/warehouse.model");
const WarehouseMaterial = require("../../../models/inventory/warehouse/warehouseMaterial.model.js");
//Response and errors
const {
  error500,
  error409,
  error404,
  error400,
} = require("../../../services/helpers/errors.js");
const { status200, success } = require("../../../services/helpers/response.js");
const axios = require("axios");
const config = require("../../../config/index.js");

//Add warehouse
const addWarehouse = async (req, res, next) => {
  const { name, code, assignTo, route } = req.body;
  try {
    const nameAlreadyExists = await Warehouse.findOne({ name }).lean();
    if (nameAlreadyExists) {
      return error409(res, "Warehouse with this name already exists");
    }

    const codeAlreadyExists = await Warehouse.findOne({ code }).lean();
    if (codeAlreadyExists) {
      return error409(res, "Warehouse with this code already exists");
    }

    await Warehouse.create({
      ...req.body,
      assignToIds: assignTo,
      routeId: route,
    });
    return status200(res, `Warehouse created successfully`);
  } catch (err) {
    return next(err);
  }
};

//Get all warehouse
const allWarehouses = async (req, res, next) => {
  const { type, text, searchMode, data, page = 1, pageSize = 10 } = req.query;

  //Query object
  let query = {};

  if (type) {
    query.type = type;
  }

  if (text) {
    query.name = { $regex: text, $options: "i" };
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

    async function getWarehouseInfo(warehouse, allUsers) {
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

      const assignToUsers = warehouse.assignToIds
        .map((userId) => findUser(userId))
        .filter(Boolean);

      //Modified response for the Warehouse screen with user information from Auth Service
      return {
        ...warehouse,
        assignToIds: assignToUsers,
      };
    }

    const warehouses = await Warehouse.find(query)
      .select("-__v")
      .lean()
      .populate([
        {
          path: "routeId",
          select: "-__v",
        },
      ])
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));

    const total = await Warehouse.countDocuments(query);
    const totalPages = Math.ceil(total / pageSize);

    //Modify response with Auth Service Response
    const allUsers = await fetchAllUsers();

    if (!allUsers.length) {
      return error404(res, "No users returned from Auth Service");
    }

    const modifiedWarehouses = await Promise.all(
      warehouses.map((warehouse) => getWarehouseInfo(warehouse, allUsers))
    );

    const response = {
      warehouses: modifiedWarehouses,
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

//Get all warehouse
const warehouseByType = async (req, res, next) => {
  const { type } = req.query;
  try {
    const warehouse = await Warehouse.find({ type })
      .select("-__v -materials -warehouseActionIds -assignToIds")
      .lean();
    return success(res, "200", "Success", warehouse);
  } catch (err) {
    return next(err);
  }
};

//Get all warehouse material, for usage in dropdown of export, transfer, check warehouse action screens
const warehouseMaterialsById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const warehouseMaterials = await WarehouseMaterial.find({
      warehouseId: id,
    })
      .populate({
        path: "materialId",
        select: "name code unit",
      })
      .lean();
    return success(res, "200", "Success", warehouseMaterials);
  } catch (err) {
    return next(err);
  }
};

//Edit warehouse
const editWarehouse = async (req, res, next) => {
  const { id } = req.params;
  try {
    const warehouseExists = await Warehouse.findByIdAndUpdate(id, {
      ...req.body,
    }).lean();

    if (!warehouseExists) {
      return error404(res, "Warehouse not found");
    }

    return status200(res, `Warehouse edited successfully`);
  } catch (err) {
    return next(err);
  }
};

//Delete warehouse
const deleteWarehouse = async (req, res, next) => {
  const { id } = req.params;
  try {
    const warehouseExists = await Warehouse.findByIdAndDelete(id).lean();
    if (!warehouseExists) {
      return error404(res, "Warehouse not found");
    }
    return status200(res, `Warehouse deleted successfully`);
  } catch (err) {
    return next(err);
  }
};

//Change status
const changeStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const statusUpdated = await Warehouse.findByIdAndUpdate(id, {
      status,
    }).lean();
    if (!statusUpdated) {
      return error404(res, "Warehouse not found");
    }
    return status200(res, `Warehouse status changed to ${status}`);
  } catch (err) {
    return next(err);
  }
};

//Change type
const changeType = async (req, res, next) => {
  const { id } = req.params;
  const { type } = req.body;
  try {
    const typeUpdated = await Warehouse.findByIdAndUpdate(id, {
      type,
    }).lean();
    if (!typeUpdated) {
      return error404(res, "Warehouse not found");
    }
    return status200(res, `Warehouse type changed to ${type}`);
  } catch (err) {
    return next(err);
  }
};

//Single warehouse detail
const warehouseDetail = async (req, res, next) => {
  const { id } = req.params;
  const { page = 1, pageSize = 10 } = req.query;

  try {
    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    const materials = await WarehouseMaterial.find({ warehouseId: id })
      .populate("materialId", "name code")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));

    const totalMaterials = await WarehouseMaterial.countDocuments({
      warehouseId: id,
    });

    const response = {
      materials,
      totalMaterials,
    };
    return success(res, "200", "Success", response);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  addWarehouse,
  allWarehouses,
  warehouseByType,
  warehouseMaterialsById,
  editWarehouse,
  deleteWarehouse,
  changeStatus,
  changeType,
  warehouseDetail,
};
