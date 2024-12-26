//Model
const Invoice = require("../../../models/finance/invoice.model.js");
const Loading = require("../../../models/inventory/loading.model.js");
const Warehouse = require("../../../models/inventory/warehouse/warehouse.model.js");
const WarehouseMaterial = require("../../../models/inventory/warehouse/warehouseMaterial.model.js");
const WarehouseAction = require("../../../models/inventory/warehouseAction/warehouseAction.model.js");
const WarehouseActionMaterial = require("../../../models/inventory/warehouseAction/warehouseActionMaterial.model.js");
//Response and errors
const {
  error500,
  error409,
  error404,
  error400,
  error400withData,
} = require("../../../services/helpers/errors.js");
const { status200, success } = require("../../../services/helpers/response.js");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const config = require("../../../config/index.js");

//Create an invoice
const createAnInvoice = async (req, res, next) => {
  const { client, invoiceNo, qrCode, materials } = req.body;
  try {
    // const loading = await Loading.findOne({ assigneeId: loggedInUser });
    const loading = await Loading.findOne({ status: "Loading" }).populate({
      path: "warehouseActionId",
    });

    if (!loading) {
      return error404(res, "Assignee not found");
    }

    const warehouseAction = await WarehouseAction.findById(
      loading.warehouseActionId
    );

    if (!warehouseAction || warehouseAction.status !== "Complete") {
      return error400(
        res,
        "Associated warehouse action is not in complete status, Perform Loading"
      );
    }

    const invoiceExist = await Invoice.findOne({ invoiceNo, qrCode });

    if (invoiceExist) {
      return error409(res, "Invoice with this number already exist");
    }

    const vehicleId = loading.vehicleId;
    let totalExportedQuantity = 0;
    let insufficientMaterials = [];
    const warehouseActionMaterialIds = [];

    for (const { materialId, quantity } of materials) {
      const warehouseMaterial = await WarehouseMaterial.findOne({
        warehouseId: vehicleId,
        materialId,
      });

      // if (!warehouseMaterial) {
      //   insufficientMaterials.push({
      //     materialId,
      //     availableQuantity: 0,
      //     requestQuantity: quantity,
      //     message: `Material with Id ${materialId} does not exist in the vehicle`,
      //   });
      //   continue;
      // }
      if (warehouseMaterial) {
        if (warehouseMaterial.quantity < quantity) {
          insufficientMaterials.push({
            materialId,
            availableQuantity: warehouseMaterial.quantity,
            requestQuantity: quantity,
            message: `Not enough quantity of material with Id ${materialId}`,
          });
        }
      }
    }

    if (insufficientMaterials.length > 0) {
      return error400withData(
        res,
        "Insufficient material quantities in the export warehouse",
        insufficientMaterials
      );
    }

    for (const { materialId, quantity } of materials) {
      const warehouseMaterial = await WarehouseMaterial.findOne({
        warehouseId: vehicleId,
        materialId,
      });

      // if (!warehouseMaterial) {
      //   return error400(
      //     res,
      //     `Material with Id ${materialId} does not exist in the vehicle`
      //   );
      // }

      // if (warehouseMaterial.quantity < quantity) {
      //   return error400(
      //     res,
      //     `Not enough quantity of material with Id ${materialId}. Available: ${warehouseMaterial.quantity}, requested: ${quantity}`
      //   );
      // }

      if (warehouseMaterial) {
        warehouseMaterial.quantity -= quantity;
        await warehouseMaterial.save();
        totalExportedQuantity += quantity;
      }
    }

    const newWarehouseAction = await WarehouseAction.create({
      docNo: uuidv4(),
      qrCode: uuidv4(),
      docDate: Date.now(),
      exportFromWarehouseId: vehicleId,
      type: "Invoice",
      createdById: req.userId,
      totalQuantity: totalExportedQuantity,
    });

    for (const { materialId, quantity } of materials) {
      const warehouseActionMaterial = await WarehouseActionMaterial.create({
        warehouseActionId: newWarehouseAction._id,
        materialId,
        quantity,
      });
      warehouseActionMaterialIds.push(warehouseActionMaterial._id);
    }

    await WarehouseAction.updateOne(
      { _id: newWarehouseAction._id },
      { $set: { warehouseActionMaterialIds } }
    );

    await Warehouse.updateOne(
      { _id: vehicleId },
      {
        $push: { warehouseActionIds: newWarehouseAction._id },
        $inc: { totalQuantity: -totalExportedQuantity },
      }
    );

    await Invoice.create({
      ...req.body,
      clientId: client,
      createdById: req.userId,
    });

    await Loading.updateOne(
      { _id: loading._id },
      { $set: { status: "Unloading" } }
    );

    return status200(res, `Invoice created successfully`);
  } catch (err) {
    return next(err);
  }
};

//Get all invoices
const allInvoice = async (req, res, next) => {
  const { type, text, searchMode, data, page = 1, pageSize = 10 } = req.query;

  //Query object
  let query = {};

  // if (type) {
  //   query.type = type;
  // }

  // if (text) {
  //   query.name = { $regex: text, $options: "i" };
  // }

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
    async function attachUserDetails(invoice, allUsers) {
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

      const createdByUser = findUser(invoice?.createdById);
      //Modified response for the Warehouse screen with user information from Auth Service
      return {
        ...invoice,
        createdByUser: createdByUser,
      };
    }

    const invoices = await Invoice.find(query)
      .select("-__v -materials")
      .lean()
      .populate([
        {
          path: "clientId",
          select: "name",
          populate: {
            path: "routeId",
          },
        },
      ])
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));

    const total = await Invoice.countDocuments(query);
    const totalPages = Math.ceil(total / pageSize);

    //Modify response with Auth Service Response
    const allUsers = await fetchAllUsers();

    if (!allUsers.length) {
      return error404(res, "No users returned from Auth Service");
    }

    const modifiedInvoices = await Promise.all(
      invoices.map((invoice) => attachUserDetails(invoice, allUsers))
    );

    const response = {
      invoices: modifiedInvoices,
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

//Delete invoice
const deleteInvoice = async (req, res, next) => {
  const { id } = req.params;
  try {
    const existInvoice = await Invoice.findById(id);
    if (!existInvoice) {
      return error404(res, "Invoice not found");
    }
    await Invoice.deleteOne({ _id: id });
    return status200(res, `Invoice deleted`);
  } catch (err) {
    return next(err);
  }
};

//Change status
const changeStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const statusUpdated = await Invoice.findByIdAndUpdate(id, {
      status,
    });
    if (!statusUpdated) {
      return error404(res, "Invoice not found");
    }
    return status200(res, `Invoice status changed to ${status}`);
  } catch (err) {
    return next(err);
  }
};

//Invoice detail
const invoiceDetail = async (req, res, next) => {
  const { id } = req.params;
  try {
    const invoiceDetail = await Invoice.findById(id)
      .populate("clientId")
      .populate({
        path: "materials.materialId",
        select: "name code unit",
      });

    if (!invoiceDetail) {
      return error404(res, "Invoice not found");
    }
    return success(res, "200", "Success", invoiceDetail);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createAnInvoice,
  allInvoice,
  deleteInvoice,
  changeStatus,
  invoiceDetail,
};
