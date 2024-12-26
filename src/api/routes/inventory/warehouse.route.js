const router = require("express").Router();
//controller
const warehouseController = require("../../../controllers/inventory/warehouse/warehouse.controller");
//helpers
const {
  changeStatus,
} = require("../../../middlewares/payloadValidators/commonValidator");
const {
  changeType,
  addWarehouse,
} = require("../../../middlewares/payloadValidators/inventoryValidator");
const { permissionHandler } = require("../../../middlewares/permissionHandler");

//Add warehouse
router.post(
  "/add",
  permissionHandler,
  addWarehouse,
  warehouseController.addWarehouse
);

//All warehouse
router.get("/all", permissionHandler, warehouseController.allWarehouses);

//Warehouse by query: [Primary, Secondary, Vehicle] For dropdowns
router.get("/by-type", permissionHandler, warehouseController.warehouseByType);

//Get all warehouse material, for usage in dropdown of export, transfer, check warehouse action screens
router.get(
  "/materials/:id",
  permissionHandler,
  warehouseController.warehouseMaterialsById
);

//Edit warehouse
router.put(
  "/edit/:id",
  permissionHandler,
  addWarehouse,
  warehouseController.editWarehouse
);

//Delete warehouse
router.delete(
  "/delete/:id",
  permissionHandler,
  warehouseController.deleteWarehouse
);

//Change status
router.patch(
  "/status/:id",
  permissionHandler,
  changeStatus,
  warehouseController.changeStatus
);

//Change type
router.patch(
  "/type/:id",
  permissionHandler,
  changeType,
  warehouseController.changeType
);

//Warehouse detail by id
router.get(
  "/detail/:id",
  permissionHandler,
  warehouseController.warehouseDetail
);

module.exports = router;
