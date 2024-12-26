//Model
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
//helpers
const {
  uploadFileToBucket,
} = require("../../../services/helpers/awsHelper.js");
const { toPlainObject } = require("../../../services/helpers/commonHelpers.js");
const axios = require("axios");
const config = require("../../../config/index.js");

//Add warehouse action
const importWarehouseAction = async (req, res, next) => {
  const { docNo, qrCode, importToWarehouse, materials } = req.body;
  try {
    let totalQuantityImported = 0;
    const warehouseActionMaterialIds = [];

    const alreadyExistDoc = await WarehouseAction.findOne({
      docNo,
      type: "Input",
    }).lean();

    if (alreadyExistDoc) {
      return error409(
        res,
        "Warehouse action with this document number already exists"
      );
    }

    const alreadyExistQr = await WarehouseAction.findOne({
      qrCode,
      type: "Input",
    }).lean();

    if (alreadyExistQr) {
      return error409(res, "Warehouse action with qrCode already exists");
    }

    //Warehouse where to import material
    const warehouse = await Warehouse.findById(importToWarehouse);
    if (!warehouse) {
      return error404(res, "Warehouse not found to import");
    }

    for (const { materialId, quantity } of materials) {
      let existsWarehouseMaterial = await WarehouseMaterial.findOne({
        warehouseId: warehouse._id,
        materialId,
      });

      if (existsWarehouseMaterial) {
        //If we find the material in warehouse then we will increase that material quantity
        existsWarehouseMaterial.quantity += quantity;
        await existsWarehouseMaterial.save();
      } else {
        //Add new material in the warehouse materials schema
        let newWarehouseMaterial = await WarehouseMaterial.create({
          warehouseId: warehouse._id,
          materialId,
          quantity,
        });
        warehouse.warehouseMaterialIds.push(newWarehouseMaterial._id);
      }

      totalQuantityImported += quantity;

      const newActionMaterial = await WarehouseActionMaterial.create({
        warehouseActionId: null,
        materialId,
        quantity,
      });

      warehouseActionMaterialIds.push(newActionMaterial._id);
    }

    warehouse.totalQuantity += totalQuantityImported;
    await warehouse.save();

    const newWarehouseAction = await WarehouseAction.create({
      ...req.body,
      type: "Input",
      importToWarehouseId: importToWarehouse,
      createdById: req.userId,
      warehouseActionMaterialIds,
    });

    await WarehouseActionMaterial.updateMany(
      { _id: { $in: warehouseActionMaterialIds } },
      { $set: { warehouseActionId: newWarehouseAction._id } }
    );

    await Warehouse.updateOne(
      { _id: importToWarehouse },
      { $push: { warehouseActionIds: newWarehouseAction._id } }
    );

    return status200(res, `Warehouse document of import created successfully`);
  } catch (err) {
    return next(err);
  }
};

//Export warehouse action
const exportWarehouseAction = async (req, res, next) => {
  const { docNo, qrCode, exportFromWarehouse, materials } = req.body;
  try {
    let totalExportedQuantity = 0;
    let insufficientMaterial = [];

    const alreadyExistDoc = await WarehouseAction.findOne({
      docNo,
      type: "Output",
    }).lean();

    if (alreadyExistDoc) {
      return error409(
        res,
        "Warehouse action with this document number already exists"
      );
    }

    const alreadyExistQr = await WarehouseAction.findOne({
      qrCode,
      type: "Output",
    }).lean();

    if (alreadyExistQr) {
      return error409(res, "Warehouse action with qrCode already exists");
    }

    const warehouse = await Warehouse.findById(exportFromWarehouse);

    if (!warehouse) {
      return error404(res, "Warehouse not found to export");
    }

    for (const { materialId, quantity } of materials) {
      const warehouseMaterial = await WarehouseMaterial.findOne({
        warehouseId: exportFromWarehouse,
        materialId,
      });

      if (!warehouseMaterial) {
        insufficientMaterial.push({
          materialId,
          availableQuantity: 0,
          requestedQuantity: quantity,
          message: `Material with Id ${materialId} does exist in the warehouse`,
        });
        continue;
      }

      //If quantity is insufficient
      if (warehouseMaterial.quantity < quantity) {
        insufficientMaterial.push({
          materialId,
          availableQuantity: warehouseMaterial.quantity,
          requestedQuantity: quantity,
          message: `Not enough quantity of material with Id ${materialId}`,
        });
      }
    }

    if (insufficientMaterial.length > 0) {
      return error400withData(
        res,
        "Insufficient material quantities",
        insufficientMaterial
      );
    }

    for (const { materialId, quantity } of materials) {
      const warehouseMaterial = await WarehouseMaterial.findOne({
        warehouseId: exportFromWarehouse,
        materialId,
      });

      // if (!warehouseMaterial) {
      //   return error400(
      //     res,
      //     `Material with Id ${materialId} does not exist in the warehouse`
      //   );
      // }
      // if (warehouseMaterial.quantity < quantity) {
      //   return error400(
      //     res,
      //     `Not enough quantity of material with Id ${materialId}. Available: ${warehouseMaterial.quantity}, requested: ${quantity}`
      //   );
      // }

      warehouseMaterial.quantity -= quantity;
      await warehouseMaterial.save();

      totalExportedQuantity += quantity;
    }

    warehouse.totalQuantity -= totalExportedQuantity;
    await warehouse.save();

    const newWarehouseAction = await WarehouseAction.create({
      ...req.body,
      type: "Output",
      exportFromWarehouseId: exportFromWarehouse,
      createdById: req.userId,
    });

    for (const { materialId, quantity } of materials) {
      await WarehouseActionMaterial.create({
        warehouseActionId: newWarehouseAction._id,
        materialId,
        quantity,
      });
    }

    await Warehouse.updateOne(
      { _id: exportFromWarehouse },
      { $push: { warehouseActionIds: newWarehouseAction._id } }
    );

    return status200(res, "Warehouse document of export created successfully");
  } catch (err) {
    return next(err);
  }
};

//Transfer warehouse action from one warehouse to another
const transferWarehouseAction = async (req, res, next) => {
  const { docNo, qrCode, importToWarehouse, exportFromWarehouse, materials } =
    req.body;

  try {
    const warehouseActionMaterialIds = [];
    let totalQuantityTransferred = 0;
    let insufficientMaterials = [];

    const alreadyExistDoc = await WarehouseAction.findOne({
      docNo,
      type: "Move",
    }).lean();

    if (alreadyExistDoc) {
      return error409(
        res,
        "Warehouse action with this document number already exists"
      );
    }

    const alreadyExistQr = await WarehouseAction.findOne({
      qrCode,
      type: "Move",
    }).lean();

    if (alreadyExistQr) {
      return error409(res, "Warehouse action with qrCode already exists");
    }

    // Find the export and import warehouses
    const exportWarehouse = await Warehouse.findById(exportFromWarehouse);
    const importWarehouse = await Warehouse.findById(importToWarehouse);

    if (!exportWarehouse) {
      return error404(res, "Export warehouse not found");
    }
    if (!importWarehouse) {
      return error404(res, "Import warehouse not found");
    }

    for (const { materialId, quantity } of materials) {
      const exportMaterial = await WarehouseMaterial.findOne({
        warehouseId: exportFromWarehouse,
        materialId,
      });

      if (!exportMaterial) {
        insufficientMaterials.push({
          materialId,
          availableQuantity: 0,
          requestedQuantity: quantity,
          message: `Material with Id ${materialId} does not exist in the export warehouse`,
        });
        continue;
      }

      if (exportMaterial.quantity < quantity) {
        insufficientMaterials.push({
          materialId,
          availableQuantity: exportMaterial.quantity,
          requestedQuantity: quantity,
          message: `Not enough quantity of material with Id ${materialId}`,
        });
      }
    }

    if (insufficientMaterials.length > 0) {
      return error400withData(
        res,
        "Insufficient material quantities",
        insufficientMaterials
      );
    }

    for (const { materialId, quantity } of materials) {
      const exportMaterial = await WarehouseMaterial.findOne({
        warehouseId: exportFromWarehouse,
        materialId,
      });

      // if (!exportMaterial) {
      //   return error400(
      //     res,
      //     `Material with ID ${materialId} does not exist in the export warehouse`
      //   );
      // }

      // if (exportMaterial.quantity < quantity) {
      //   return error400(
      //     res,
      //     `Not enough quantity of material with ID ${materialId}. Available: ${exportMaterial.quantity}, requested: ${quantity}`
      //   );
      // }

      exportMaterial.quantity -= quantity;
      await exportMaterial.save();

      //Decrease total quantity of warehouse as material quantity was deducted
      exportWarehouse.totalQuantity -= quantity;

      const importMaterial = await WarehouseMaterial.findOne({
        warehouseId: importToWarehouse,
        materialId,
      });

      if (importMaterial) {
        importMaterial.quantity += quantity;
        await importMaterial.save();
      } else {
        const newImportMaterial = await WarehouseMaterial.create({
          warehouseId: importToWarehouse,
          materialId,
          quantity,
        });
        importWarehouse.warehouseMaterialIds.push(newImportMaterial._id);
      }

      importWarehouse.totalQuantity += quantity;

      const warehouseActionMaterial = await WarehouseActionMaterial.create({
        materialId,
        quantity,
      });

      warehouseActionMaterialIds.push(warehouseActionMaterial._id);
      totalQuantityTransferred += quantity;
    }

    await exportWarehouse.save();
    await importWarehouse.save();

    const newWarehouseAction = await WarehouseAction.create({
      ...req.body,
      type: "Move",
      exportFromWarehouseId: exportFromWarehouse,
      importToWarehouseId: importToWarehouse,
      totalQuantity: totalQuantityTransferred,
      createdById: req.userId,
      warehouseActionMaterialIds,
    });

    await WarehouseActionMaterial.updateMany(
      { _id: { $in: warehouseActionMaterialIds } },
      { $set: { warehouseActionId: newWarehouseAction._id } }
    );

    await Warehouse.updateOne(
      { _id: exportFromWarehouse },
      { $push: { warehouseActionIds: newWarehouseAction._id } }
    );

    await Warehouse.updateOne(
      { _id: importToWarehouse },
      { $push: { warehouseActionIds: newWarehouseAction._id } }
    );

    return status200(
      res,
      "Warehouse document of transfer created successfully"
    );
  } catch (err) {
    return next(err);
  }
};

//Check warehouse action, check the quantity and replace the existing quantities
const checkWarehouseAction = async (req, res, next) => {
  const { docNo, qrCode, checkFromWarehouse, materials } = req.body;
  try {
    let totalDifference = 0;

    const alreadyExistDoc = await WarehouseAction.findOne({
      docNo,
      type: "Cancel",
    }).lean();

    if (alreadyExistDoc) {
      return error409(
        res,
        "Warehouse action with this document number already exists"
      );
    }

    const alreadyExistQr = await WarehouseAction.findOne({
      qrCode,
      type: "Cancel",
    }).lean();

    if (alreadyExistQr) {
      return error409(res, "Warehouse action with qrCode already exists");
    }

    const warehouse = await Warehouse.findById(checkFromWarehouse);

    if (!warehouse) {
      return error404(res, "Warehouse not found to check");
    }

    for (const { materialId, actualQuantity } of materials) {
      const existingMaterial = await WarehouseMaterial.findOne({
        warehouseId: checkFromWarehouse,
        materialId: materialId,
      });

      if (!existingMaterial) {
        return error400(
          res,
          `Material with Id ${materialId} does not exist in the warehouse`
        );
      }

      // Calculate the difference between the actualQuantity and existing quantity
      const quantityDifference = actualQuantity - existingMaterial.quantity;
      existingMaterial.quantity = actualQuantity;
      await existingMaterial.save();

      totalDifference += quantityDifference;
    }

    warehouse.totalQuantity += totalDifference;
    await warehouse.save();

    const newWarehouseAction = await WarehouseAction.create({
      ...req.body,
      type: "Cancel",
      checkFromWarehouseId: checkFromWarehouse,
      warehouseActionMaterialIds: [],
      createdById: req.userId,
    });

    for (const { materialId, actualQuantity, quantity } of materials) {
      const warehouseActionMaterial = await WarehouseActionMaterial.create({
        warehouseActionId: newWarehouseAction._id,
        materialId,
        actualQuantity,
        quantity,
      });

      newWarehouseAction.warehouseActionMaterialIds.push(
        warehouseActionMaterial._id
      );
    }

    await newWarehouseAction.save();

    await Warehouse.updateOne(
      {
        _id: checkFromWarehouse,
      },
      {
        $push: {
          warehouseActionIds: newWarehouseAction._id,
        },
      }
    );

    return status200(res, "Warehouse check action created successfully");
  } catch (err) {
    return next(err);
  }
};

//Get all warehouse action
const allWarehouseActions = async (req, res, next) => {
  const { type, text, searchMode, page = 1, pageSize = 10 } = req.query;

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

    async function getWarehouseActionInfo(action, allUsers) {
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

      const createdByUser = findUser(action.createdById);
      //Modified response for the Action Detail Screen with User information from Auth Service
      return {
        ...action,
        createdById: createdByUser,
      };
    }

    const warehouseActions = await WarehouseAction.find(query)
      .select("-__v")
      .lean()
      .populate([
        {
          path: "importToWarehouseId exportFromWarehouseId checkFromWarehouseId",
          select: "-__v",
        },
      ])
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));

    const total = await WarehouseAction.countDocuments(query);
    const totalPages = Math.ceil(total / pageSize);

    //Modify response with Auth Service Response
    const allUsers = await fetchAllUsers();

    if (!allUsers.length) {
      return error404(res, "No users returned from Auth Service");
    }

    const modifiedActions = await Promise.all(
      warehouseActions.map((action) => getWarehouseActionInfo(action, allUsers))
    );

    const response = {
      warehouseActions: modifiedActions,
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

//Change status
const changeStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const statusUpdated = await WarehouseAction.findByIdAndUpdate(id, {
      status,
    }).lean();
    if (!statusUpdated) {
      return error404(res, "Warehouse action not found");
    }
    return status200(res, `Warehouse action status changed to ${status}`);
  } catch (err) {
    return next(err);
  }
};

//Upload docs to warehouse action
const uploadDocsToAction = async (req, res, next) => {
  const { id } = req.params;
  const file = toPlainObject(req.files);
  try {
    const warehouseActionExists = await WarehouseAction.findById(id);
    if (!warehouseActionExists) {
      return error404(res, "Warehouse action not found");
    }

    const uploadDocs = [];

    for (const docFile of file.files) {
      const docUploadParams = {
        Bucket: config.bucketName,
        Key: `inventory/document/${Date.now()}_${docFile.originalname}`,
        Body: docFile.buffer,
        ContentType: docFile.mimetype,
      };

      const docUploadResult = await uploadFileToBucket(docUploadParams);

      uploadDocs.push({
        name: docFile.originalname,
        format: docFile.mimetype,
        location: docUploadResult.location,
        key: docUploadResult.key,
      });
    }

    await WarehouseAction.findByIdAndUpdate(id, {
      documents: uploadDocs,
    });

    return status200(res, `Files upload to warehouse action successfully`);
  } catch (err) {
    return next(err);
  }
};

//Delete warehouse action
const deleteWarehouseAction = async (req, res, next) => {
  const { id } = req.params;
  try {
    const warehouseExists = await WarehouseAction.findByIdAndDelete(id).lean();
    if (!warehouseExists) {
      return error404(res, "Warehouse action not found");
    }
    await Warehouse.updateOne(
      {
        _id: warehouseExists.warehouseId,
      },
      {
        warehouseActionIds: [],
      }
    );
    return status200(res, `Warehouse action deleted successfully`);
  } catch (err) {
    return next(err);
  }
};

//Get warehouse action check report of import
const importWarehouseCheckReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { type: "Input" };

    if (startDate || endDate) {
      query.docDate = {};
      if (startDate) {
        query.docDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.docDate.$lte = new Date(endDate);
      }
    }

    const inputActions = await WarehouseAction.find(query).populate({
      path: "warehouseActionMaterialIds",
      populate: {
        path: "materialId",
      },
    });

    const materialMap = {};

    inputActions.forEach((action) => {
      action.warehouseActionMaterialIds.forEach((material) => {
        const materialId = material.materialId._id.toString();
        if (!materialMap[materialId]) {
          materialMap[materialId] = {
            name: material.materialId.name,
            code: material.materialId.code,
            unit: material.materialId.unit,
            quantity: material.quantity,
          };
        } else {
          materialMap[materialId].quantity += material.quantity;
        }
      });
    });

    const combinedMaterials = Object.values(materialMap);

    return success(res, "200", "Success", combinedMaterials);
  } catch (err) {
    return next(err);
  }
};

//Get warehouse action check report of export
const exportWarehouseCheckReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { type: "Output" };

    if (startDate || endDate) {
      query.docDate = {};
      if (startDate) {
        query.docDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.docDate.$lte = new Date(endDate);
      }
    }

    const outputActions = await WarehouseAction.find(query).populate({
      path: "warehouseActionMaterialIds",
      populate: {
        path: "materialId",
      },
    });

    const materialMap = {};

    outputActions.forEach((action) => {
      action.warehouseActionMaterialIds.forEach((material) => {
        const materialId = material.materialId._id.toString();
        if (!materialMap[materialId]) {
          materialMap[materialId] = {
            name: material.materialId.name,
            code: material.materialId.code, // Use 'code' as SKU
            unit: material.materialId.unit,
            quantity: material.quantity,
          };
        } else {
          materialMap[materialId].quantity += material.quantity;
        }
      });
    });

    const combinedMaterials = Object.values(materialMap);

    return success(res, "200", "Success", combinedMaterials);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  importWarehouseAction,
  exportWarehouseAction,
  transferWarehouseAction,
  checkWarehouseAction,
  allWarehouseActions,
  changeStatus,
  uploadDocsToAction,
  deleteWarehouseAction,
  importWarehouseCheckReport,
  exportWarehouseCheckReport,
};
