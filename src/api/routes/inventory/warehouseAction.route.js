const router = require("express").Router();
//controller
const warehouseActionController = require("../../../controllers/inventory/warehouse/warehouseAction.controller");
//helpers
const {
  checkFiles,
} = require("../../../middlewares/payloadValidators/fileCheck");
const {
  importWarehouseAction,
  exportWarehouseAction,
  transferWarehouseAction,
  checkWarehouseAction,
  changeStatus,
} = require("../../../middlewares/payloadValidators/inventoryValidator");
const { permissionHandler } = require("../../../middlewares/permissionHandler");
const { uploadFiles } = require("../../../services/helpers/fileHelper");

//Import warehouse action
router.post(
  "/import",
  permissionHandler,
  importWarehouseAction,
  warehouseActionController.importWarehouseAction
);

//Export warehouse action
router.post(
  "/export",
  permissionHandler,
  exportWarehouseAction,
  warehouseActionController.exportWarehouseAction
);

//Transfer warehouse action
router.post(
  "/transfer",
  permissionHandler,
  transferWarehouseAction,
  warehouseActionController.transferWarehouseAction
);

//Check warehouse action
router.post(
  "/check",
  permissionHandler,
  checkWarehouseAction,
  warehouseActionController.checkWarehouseAction
);

//Get warehouse actions
router.get(
  "/all",
  permissionHandler,
  warehouseActionController.allWarehouseActions
);

//Change status of warehouse action
router.patch(
  "/status/:id",
  permissionHandler,
  changeStatus,
  warehouseActionController.changeStatus
);

//Add documents to warehouse action
router.put(
  "/upload-doc/:id",
  permissionHandler,
  uploadFiles,
  checkFiles,
  warehouseActionController.uploadDocsToAction
);

//Delete warehouse action
router.delete(
  "/delete/:id",
  permissionHandler,
  warehouseActionController.deleteWarehouseAction
);

//Get warehouse action check report of input/import
router.get(
  "/check-report/import",
  permissionHandler,
  warehouseActionController.importWarehouseCheckReport
);

//Get warehouse action check report of output/export
router.get(
  "/check-report/export",
  permissionHandler,
  warehouseActionController.exportWarehouseCheckReport
);

module.exports = router;
