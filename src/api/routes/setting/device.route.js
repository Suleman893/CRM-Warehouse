const router = require("express").Router();
//controller
const deviceController = require("../../../controllers/setting/device/device.controller");
//helpers
const {
  addDevice,
} = require("../../../middlewares/payloadValidators/deviceValidator");
const {
  changeStatus,
} = require("../../../middlewares/payloadValidators/commonValidator");
const { permissionHandler } = require("../../../middlewares/permissionHandler");

//Add device
router.post("/add", permissionHandler, addDevice, deviceController.addDevice);

//All devices
router.get("/all", permissionHandler, deviceController.allDevices);

//Edit device
router.put(
  "/edit/:id",
  permissionHandler,
  addDevice,
  deviceController.editDevice
);

//Delete device
router.delete("/delete/:id", permissionHandler, deviceController.deleteDevice);

//Change status of device
router.patch(
  "/status/:id",
  permissionHandler,
  changeStatus,
  deviceController.changeStatus
);

//Sync device
router.put("/sync", deviceController.syncDevice);

module.exports = router;
