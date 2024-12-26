const router = require("express").Router();
//controller
const serviceController = require("../../../controllers/setting/service/service.controller");
//helpers
const {
  changeStatus,
} = require("../../../middlewares/payloadValidators/commonValidator");
const {
  addService,
} = require("../../../middlewares/payloadValidators/serviceValidator");
const { permissionHandler } = require("../../../middlewares/permissionHandler");

//Add service
router.post(
  "/add",
  permissionHandler,
  addService,
  serviceController.addService
);

//All services
router.get("/all", permissionHandler, serviceController.allServices);

//All services for dropdown
router.get(
  "/dropdown",
  permissionHandler,
  serviceController.allServicesForDropdown
);

//Edit service
router.put(
  "/edit/:id",
  permissionHandler,
  addService,
  serviceController.editService
);

//Delete service
router.delete(
  "/delete/:id",
  permissionHandler,
  serviceController.deleteService
);

//Change status
router.patch(
  "/status/:id",
  permissionHandler,
  changeStatus,
  serviceController.changeStatus
);

module.exports = router;
