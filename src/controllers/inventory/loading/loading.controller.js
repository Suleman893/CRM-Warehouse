//Model
const Route = require("../../../models/setting/route.model.js");
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

//All route loadings
const allRouteLoading = async (req, res, next) => {
  try {
    const routeMaterials = await Route.aggregate([
      {
        $lookup: {
          from: "clients",
          localField: "_id",
          foreignField: "routeId",
          as: "clientsInfo",
        },
      },
      {
        $unwind: "$clientsInfo",
      },
      {
        $lookup: {
          from: "orders",
          localField: "clientsInfo._id",
          foreignField: "clientId",
          as: "ordersInfo",
        },
      },
      {
        $unwind: "$ordersInfo",
      },
      {
        $unwind: "$ordersInfo.materials",
      },
      {
        $lookup: {
          from: "materials",
          localField: "ordersInfo.materials.materialId",
          foreignField: "_id",
          as: "materialDetails",
        },
      },
      {
        $unwind: "$materialDetails",
      },
      {
        $group: {
          _id: {
            routeId: "$_id",
            routeName: "$name",
            materialId: "$materialDetails._id",
            materialName: "$materialDetails.name",
            materialPicture: "$materialDetails.picture",
            price: "$ordersInfo.materials.price",
            discount: "$ordersInfo.materials.discount",
            vat: "$ordersInfo.materials.vat",
            unit: "$ordersInfo.materials.unit",
            amount: "$ordersInfo.materials.amount",
          },
          totalQuantity: { $sum: "$ordersInfo.materials.quantity" },
        },
      },
      {
        $group: {
          _id: {
            routeId: "$_id.routeId",
            routeName: "$_id.routeName",
          },
          materials: {
            $push: {
              materialId: "$_id.materialId",
              materialName: "$_id.materialName",
              materialPicture: "$_id.materialPicture",
              price: "$_id.price",
              discount: "$_id.discount",
              vat: "$_id.vat",
              unit: "$_id.unit",
              amount: "$_id.amount",
              totalQuantity: "$totalQuantity",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          routeId: "$_id.routeId",
          routeName: "$_id.routeName",
          materials: 1,
        },
      },
    ]);

    return success(res, "200", "Success", routeMaterials);
  } catch (err) {
    return next(err);
  }
};

//Assign the vehicle/ Save as loading
const assignVehicle = async (req, res, next)=> {
  const { warehouse, vehicle, user, route, materials } = req.body;
  try {
    let warehouseActionMaterials = [];
    let totalQuantityTransferred = 0;
    let insufficientMaterials = [];

    const exportWarehouse = await Warehouse.findById(warehouse);
    if (!exportWarehouse) {
      return error404(res, "Primary warehouse not found");
    }

    const importVehicleWarehouse = await Warehouse.findById(vehicle);
    if (!importVehicleWarehouse) {
      return error404(res, "Vehicle warehouse not found");
    }

    //Check if material exists and also quantity is available to export
    for (const { materialId, quantity } of materials) {
      const exportMaterial = await WarehouseMaterial.findOne({
        warehouseId: warehouse,
        materialId: materialId,
      });

      if (!exportMaterial) {
        insufficientMaterials.push({
          materialId,
          availableQuantity: 0,
          requestQuantity: quantity,
          message: `Material with ID ${materialId} not found in export warehouse`,
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
        "Insufficient material quantities in the export warehouse",
        insufficientMaterials
      );
    }

    for (const { materialId, quantity } of materials) {
      //Export the material, performing warehouse transfer action with pending status
      const exportMaterial = await WarehouseMaterial.findOne({
        warehouseId: warehouse,
        materialId: materialId,
      });

      // if (!exportMaterial) {
      //   return error400(
      //     res,
      //     `Material with ID ${materialId} not found in export warehouse`
      //   );
      // }

      // if (exportMaterial.quantity < quantity) {
      //   return error400(
      //     res,
      //     `Insufficient quantity for material ID ${materialId}. Available: ${exportMaterial.quantity}, requested: ${quantity}`
      //   );
      // }

      exportMaterial.quantity -= quantity;
      await exportMaterial.save();

      exportWarehouse.totalQuantity -= quantity;

      //Importing in vehicle
      let importMaterial = await WarehouseMaterial.findOne({
        warehouseId: vehicle,
        materialId: materialId,
      });

      if (importMaterial) {
        importMaterial.quantity += quantity;
        await importMaterial.save();
      } else {
        importMaterial = await WarehouseMaterial.create({
          warehouseId: vehicle,
          materialId,
          quantity,
        });

        await Warehouse.updateOne(
          {
            _id: vehicle,
          },
          {
            $push: { warehouseMaterialIds: importMaterial._id },
          }
        );
      }

      importVehicleWarehouse.totalQuantity += quantity;

      const actionMaterial = await WarehouseActionMaterial.create({
        materialId,
        quantity,
      });

      warehouseActionMaterials.push(actionMaterial._id);
      totalQuantityTransferred += quantity;
    }

    await exportWarehouse.save();
    await importVehicleWarehouse.save();

    const newWarehouseAction = await WarehouseAction.create({
      type: "Move",
      docNo: uuidv4(),
      docDate: Date.now(),
      qrCode: uuidv4(),
      status: "Pending",
      exportFromWarehouseId: warehouse,
      importToWarehouseId: vehicle,
      warehouseActionMaterialIds: warehouseActionMaterials,
      totalQuantity: totalQuantityTransferred,
      createdById: req.userId,
    });

    await WarehouseActionMaterial.updateMany(
      { _id: { $in: warehouseActionMaterials } },
      { warehouseActionId: newWarehouseAction._id }
    );

    await Warehouse.updateOne(
      { _id: warehouse },
      { $push: { warehouseActionIds: newWarehouseAction._id } }
    );

    //In warehouse of type vehicle setting the route
    await Warehouse.updateOne(
      { _id: vehicle },
      {
        $set: { routeId: route },
        $push: { warehouseActionIds: newWarehouseAction._id },
      }
    );

    await Loading.create({
      warehouseActionId: newWarehouseAction._id,
      vehicleId: vehicle,
      assigneeId: user,
      routeId: route,
      status: "Loading",
    });

    return status200(res, `Vehicle assigned successfully`);
  } catch (err) {
    return next(err);
  }
};

//Get all vehicles - All loaders
const allLoading = async (req, res, next) => {
  const { type, text, searchMode, data } = req.query;
  try {
    //Query object
    let query = {
      "materials.receivedQuantity": { $gt: 0 },
    };

    if (type) {
      query.type = type;
    }

    if (text) {
      query.name = { $regex: text, $options: "i" };
    }

    const loadings = await Loading.find({ status: "Loading" })
      .select("-__v")
      .populate({
        path: "vehicleId",
        select: "name code type totalQuantity status warehouseMaterialIds",
        populate: {
          path: "warehouseMaterialIds",
          select: "materialId quantity",
          populate: {
            path: "materialId",
            select: "name description code",
          },
        },
      })
      .populate({
        path: "warehouseActionId",
        select: "type docNo docDate qrCode totalQuantity status totalQuantity",
        // populate: {
        //   path: "warehouseActionMaterialIds",
        //   select: "materialId quantity",
        // populate: {
        //   path: "materialId",
        //   select: "name description",
        // },
        // },
      });
    // .populate({
    //   path: "assigneeId",
    //   select: "name email _id",
    // });

    return success(res, "200", "Success", loadings);
  } catch (err) {
    return next(err);
  }
};

//Load the vehicle
const loadVehicle = async (req, res, next) => {
  const { id } = req.params;
  const { materials } = req.body;

  try {
    let totalQuantity = 0;
    const loading = await Loading.findById(id);

    if (!loading) {
      return error404(res, "Loading not found");
    }

    const { vehicleId, warehouseActionId } = loading;

    // const warehouseActionCompleted = await WarehouseAction.findOne({
    //   _id: warehouseActionId,
    //   status: "Complete",
    // });

    // if (warehouseActionCompleted) {
    //   return error409(res, "Warehouse action of transfer already completed");
    // }

    const warehouseAction = await WarehouseAction.findById(
      warehouseActionId
    ).populate("warehouseActionMaterialIds");

    if (!warehouseAction) {
      return error404(res, "Warehouse action not found");
    }

    for (const { materialId, quantity } of materials) {
      let warehouseMaterial = await WarehouseMaterial.findOne({
        warehouseId: vehicleId,
        materialId: materialId,
      });

      if (warehouseMaterial) {
        warehouseMaterial.quantity = quantity;
        await warehouseMaterial.save();
      }

      totalQuantity += quantity;

      let warehouseActionMaterial =
        warehouseAction.warehouseActionMaterialIds.find(
          (wam) => wam.materialId.toString() === materialId
        );

      if (warehouseActionMaterial) {
        await WarehouseActionMaterial.findByIdAndUpdate(
          warehouseActionMaterial._id,
          { quantity: quantity }
        );
      }
    }

    const warehouse = await Warehouse.findById(vehicleId);
    warehouse.totalQuantity = totalQuantity;
    await warehouse.save();

    await WarehouseAction.findByIdAndUpdate(warehouseActionId, {
      totalQuantity: totalQuantity,
      status: "Complete",
    });

    return status200(res, `Loading completed successfully`);
  } catch (err) {
    return next(err);
  }
};

//Get all unloading-vehicles - All unloaders
const allUnLoading = async (req, res, next) => {
  const { type, text, searchMode, data } = req.query;
  try {
    //Query object
    let query = {};

    if (type) {
      query.type = type;
    }

    if (text) {
      query.name = { $regex: text, $options: "i" };
    }

    const unloadings = await Loading.find({ status: "Unloading" })
      .select("-__v")
      .populate({
        path: "vehicleId",
        select: "name code type totalQuantity status warehouseMaterialIds",
        populate: {
          path: "warehouseMaterialIds",
          select: "materialId quantity",
          match: { quantity: { $gt: 0 } },
          populate: {
            path: "materialId",
            select: "name description code",
          },
        },
      });
    // .populate({
    //   path: "warehouseActionId",
    //   select: "type docNo docDate qrCode totalQuantity status totalQuantity",
    // populate: {
    //   path: "warehouseActionMaterialIds",
    //   select: "materialId quantity",
    // populate: {
    //   path: "materialId",
    //   select: "name description",
    // },
    // },
    // });
    // .populate({
    //   path: "assigneeId",
    //   select: "name email _id",
    // });

    return success(res, "200", "Success", unloadings);
  } catch (err) {
    return next(err);
  }
};

//Unload the vehicle
const unloadVehicle = async (req, res, next) => {
  const { id } = req.params;
  const { materials } = req.body;

  try {
    const warehouseActionMaterialIds = [];
    let totalQuantityTransferred = 0;
    let insufficientMaterials = [];
    let totalReceivedQuantity = 0;

    const loading = await Loading.findById(id).populate({
      path: "warehouseActionId",
    });

    if (!loading) {
      return error404(res, "Loading not found");
    }

    const { vehicleId, warehouseActionId } = loading;

    const previousWarehouseAction = await WarehouseAction.findById(
      warehouseActionId._id
    );

    if (!previousWarehouseAction) {
      return error404(res, "Warehouse action not found");
    }

    const importToWarehouse = previousWarehouseAction.exportFromWarehouseId;
    const exportFromWarehouse = vehicleId;

    const exportWarehouse = await Warehouse.findById(exportFromWarehouse);
    const importWarehouse = await Warehouse.findById(importToWarehouse);

    if (!exportWarehouse) {
      return error404(res, "Vehicle not found");
    }

    if (!importWarehouse) {
      return error404(res, "Warehouse not found");
    }

    for (const { materialId, quantity } of materials) {
      let vehicleMaterial = await WarehouseMaterial.findOne({
        warehouseId: vehicleId,
        materialId: materialId,
      });

      if (vehicleMaterial) {
        vehicleMaterial.quantity = quantity;
        await vehicleMaterial.save();
      }
      totalReceivedQuantity += quantity;
      //Handle the case where the material in payload not in vehicle
    }

    exportWarehouse.totalQuantity = totalReceivedQuantity;
    await exportWarehouse.save();

    for (const { materialId, quantity } of materials) {
      const exportMaterial = await WarehouseMaterial.findOne({
        warehouseId: vehicleId,
        materialId: materialId,
      });

      if (!exportMaterial) {
        insufficientMaterials.push({
          materialId,
          availableQuantity: 0,
          requestedQuantity: quantity,
          message: `Material with Id ${materialId} not found in vehicle to export warehouse`,
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
        "Insufficient material quantities in the export warehouse/vehicle",
        insufficientMaterials
      );
    }

    for (const { materialId, quantity } of materials) {
      let vehicleMaterial = await WarehouseMaterial.findOne({
        warehouseId: vehicleId,
        materialId,
      });

      vehicleMaterial.quantity -= quantity;
      await vehicleMaterial.save();
      exportWarehouse.totalQuantity -= quantity;

      let warehouseMaterial = await WarehouseMaterial.findOne({
        warehouseId: importToWarehouse,
        materialId,
      });

      if (warehouseMaterial) {
        warehouseMaterial.quantity += quantity;
        await warehouseMaterial.save();
      } else {
        warehouseMaterial = await WarehouseMaterial.create({
          warehouseId: importToWarehouse,
          materialId,
          quantity,
        });
        importWarehouse.warehouseMaterialIds.push(warehouseMaterial._id);
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
      docNo: uuidv4(),
      qrCode: uuidv4(),
      docDate: Date.now(),
      type: "Move",
      exportFromWarehouseId: exportFromWarehouse,
      importToWarehouseId: importToWarehouse,
      totalQuantity: totalQuantityTransferred,
      warehouseActionMaterialIds,
      status: "Complete",
      createdById: req.userId,
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

    //Delete the loading at end so that removed from our listing.
    await Loading.deleteOne({ _id: id });
    return status200(res, "Unload and transfer completed successfully");
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  allRouteLoading,
  assignVehicle,
  allLoading,
  loadVehicle,
  allUnLoading,
  unloadVehicle,
};
